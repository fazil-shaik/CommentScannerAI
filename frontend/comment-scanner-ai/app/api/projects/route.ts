import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getOrCreateUserId } from "@/db/user";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getOrCreateUserId(session.user.email, session.user.name);

    const allProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    return NextResponse.json(allProjects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getOrCreateUserId(session.user.email, session.user.name);
    const body = await req.json();
    const { name, sourceType, description } = body;

    if (!name || !sourceType) {
      return NextResponse.json({ error: "Name and sourceType are required fields." }, { status: 400 });
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        name,
        sourceType,
        description,
        userId,
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
