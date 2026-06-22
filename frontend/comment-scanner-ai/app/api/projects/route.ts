import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return NextResponse.json(allProjects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
