import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const topics = await prisma.topic.findMany({
    orderBy: [
      {
        subject: {
          name: "asc",
        },
      },
      {
        name: "asc",
      },
    ],
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return NextResponse.json({
    topics,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    const description =
      body.description == null
        ? null
        : String(body.description).trim() || null;

    const subjectId = String(body.subjectId ?? "").trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        {
          message:
            "Topic name must be between 2 and 100 characters.",
        },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        {
          message: "Please select a subject.",
        },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        isActive: true,
      },
    });

    if (!subject) {
      return NextResponse.json(
        {
          message:
            "Selected subject was not found or is inactive.",
        },
        { status: 400 }
      );
    }

    const existingTopic = await prisma.topic.findUnique({
      where: {
        subjectId_name: {
          subjectId,
          name,
        },
      },
    });

    if (existingTopic) {
      return NextResponse.json(
        {
          message:
            "A topic with this name already exists under this subject.",
        },
        { status: 409 }
      );
    }

    const topic = await prisma.topic.create({
      data: {
        subjectId,
        name,
        description,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Topic created successfully.",
        topic,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        message: "Failed to create topic.",
      },
      { status: 500 }
    );
  }
}