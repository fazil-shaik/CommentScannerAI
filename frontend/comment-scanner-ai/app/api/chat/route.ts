import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, question } = body;

    if (!projectId || !question) {
      return NextResponse.json({ error: "projectId and question are required fields." }, { status: 400 });
    }

    // 1. Fetch comments for this project
    const projectComments = await db
      .select({
        text: comments.text,
        sentiment: comments.sentiment,
        topic: comments.topic,
        emotion: comments.emotion,
      })
      .from(comments)
      .where(eq(comments.projectId, projectId));

    if (projectComments.length === 0) {
      return NextResponse.json({
        answer: "There are no comments in this project yet. Please import some feedback before asking questions.",
      });
    }

    // 2. Call the Python FastAPI ML backend /chat endpoint
    try {
      const mlResponse = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments: projectComments,
          question: question,
        }),
      });

      if (mlResponse.ok) {
        const chatData = await mlResponse.json();
        return NextResponse.json({
          answer: chatData.answer,
          sources: chatData.sources || [],
        });
      }
    } catch (e) {
      console.error("Error communicating with AI Chat microservice:", e);
    }

    // Fallback: local direct answer in typescript if microservice is down
    return NextResponse.json({
      answer: "The AI analysis server is currently unreachable. Please check if the FastAPI backend is running.",
    });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
