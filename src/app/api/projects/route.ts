import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    return await verifyAuth(token);
  } catch (error) {
    return null;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const whereClause = session.role === "ADMIN" ? {} : {
      users: {
        some: {
          id: session.id,
        },
      },
    };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: {
          select: {
            progress: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const projectCode = `PRJ-${Date.now()}`;

    // estrai userIds per collegarli al progetto
    const { userIds, ...projectData } = data;

    const project = await prisma.project.create({
      data: {
        ...projectData,
        code: projectCode,
        ...(userIds && userIds.length > 0 ? {
          users: {
            connect: userIds.map((id: string) => ({ id }))
          }
        } : {})
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
