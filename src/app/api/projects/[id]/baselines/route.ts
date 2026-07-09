import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyAuth(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { users: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && !project.users.some((u) => u.id === user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const baselines = await prisma.projectBaseline.findMany({
      where: { projectId },
      include: {
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(baselines);
  } catch (error) {
    console.error('Failed to fetch baselines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch baselines' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyAuth(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { users: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && !project.users.some((u) => u.id === user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get current tasks
    const currentTasks = await prisma.task.findMany({
      where: { projectId },
    });

    // Create baseline
    const baseline = await prisma.$transaction(async (tx) => {
      const newBaseline = await tx.projectBaseline.create({
        data: {
          projectId,
          name,
          tasks: {
            create: currentTasks.map((t) => ({
              taskId: t.id,
              startDate: t.startDate,
              endDate: t.endDate,
            })),
          },
        },
        include: {
          tasks: true,
        },
      });
      return newBaseline;
    });

    return NextResponse.json(baseline);
  } catch (error) {
    console.error('Failed to create baseline:', error);
    return NextResponse.json(
      { error: 'Failed to create baseline' },
      { status: 500 }
    );
  }
}
