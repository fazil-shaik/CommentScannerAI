import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, comments, reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // 1. Fetch project
    const projectList = await db.select().from(projects).where(eq(projects.id, projectId));
    if (projectList.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectList[0];

    // 2. Fetch comments
    const projectComments = await db.select().from(comments).where(eq(comments.projectId, projectId));

    // 3. Fetch reports
    const projectReports = await db.select().from(reports).where(eq(reports.projectId, projectId));

    // 4. Calculate metrics
    const totalComments = projectComments.length;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let totalToxicity = 0;

    const topicCounts: Record<string, number> = {
      pricing: 0,
      performance: 0,
      features: 0,
      bugs: 0,
      support: 0,
      other: 0,
    };

    const emotionCounts: Record<string, number> = {
      joy: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      surprise: 0,
      neutral: 0,
    };

    projectComments.forEach((c: { sentiment: string; toxicity: number | null; topic: string; emotion: string; }) => {
      // Sentiment
      if (c.sentiment === "positive") positiveCount++;
      else if (c.sentiment === "negative") negativeCount++;
      else neutralCount++;

      // Toxicity
      if (c.toxicity !== null) totalToxicity += c.toxicity;

      // Topic
      if (c.topic && c.topic in topicCounts) {
        topicCounts[c.topic]++;
      } else if (c.topic) {
        topicCounts.other++;
      }

      // Emotion
      if (c.emotion && c.emotion in emotionCounts) {
        emotionCounts[c.emotion]++;
      } else if (c.emotion) {
        emotionCounts.neutral++;
      }
    });

    const averageToxicity = totalComments > 0 ? totalToxicity / totalComments : 0;

    // Compile Top Complaints and Top Feature Requests from raw comments
    const topComplaints = projectComments
      .filter((c: { sentiment: string; topic: string; }) => c.sentiment === "negative" && (c.topic === "bugs" || c.topic === "performance" || c.topic === "pricing"))
      .slice(0, 5)
      .map((c: { id: any; text: any; topic: any; sentiment: any; }) => ({
        id: c.id,
        text: c.text,
        topic: c.topic,
        sentiment: c.sentiment,
      }));

    const topFeatureRequests = projectComments
      .filter((c: { topic: string; }) => c.topic === "features")
      .slice(0, 5)
      .map((c: { id: any; text: any; topic: any; sentiment: any; }) => ({
        id: c.id,
        text: c.text,
        topic: c.topic,
        sentiment: c.sentiment,
      }));

    return NextResponse.json({
      project,
      comments: projectComments,
      reports: projectReports,
      stats: {
        totalComments,
        sentimentBreakdown: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
        },
        topicDistribution: topicCounts,
        emotionDistribution: emotionCounts,
        averageToxicity,
        topComplaints,
        topFeatureRequests,
      },
    });
  } catch (error: any) {
    console.error("Error fetching project details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const deleteResult = await db.delete(projects).where(eq(projects.id, projectId)).returning();

    if (deleteResult.length === 0) {
      return NextResponse.json({ error: "Project not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully", deletedProject: deleteResult[0] });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
