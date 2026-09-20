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

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteProps
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: {
      id,
    },
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

  if (!topic) {
    return NextResponse.json(
      { message: "Topic not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    topic,
  });
}

export async function PUT(
  request: Request,
  { params }: RouteProps
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const { id } = await params;

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
        { message: "Please select a subject." },
        { status: 400 }
      );
    }

    const existingTopic = await prisma.topic.findUnique({
      where: {
        id,
      },
    });

    if (!existingTopic) {
      return NextResponse.json(
        { message: "Topic not found." },
        { status: 404 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      return NextResponse.json(
        {
          message: "Selected subject was not found.",
        },
        { status: 400 }
      );
    }

    if (!subject.isActive) {
      return NextResponse.json(
        {
          message:
            "Cannot assign a topic to an inactive subject.",
        },
        { status: 400 }
      );
    }

    const duplicate = await prisma.topic.findFirst({
      where: {
        subjectId,
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          message:
            "A topic with this name already exists under this subject.",
        },
        { status: 409 }
      );
    }

    const topic = await prisma.topic.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        subjectId,
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

    return NextResponse.json({
      success: true,
      message: "Topic updated successfully.",
      topic,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Failed to update topic.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteProps
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!topic) {
    return NextResponse.json(
      {
        message: "Topic not found.",
      },
      { status: 404 }
    );
  }

  if (topic._count.questions > 0) {
    return NextResponse.json(
      {
        message:
          "This topic cannot be deleted because questions are associated with it. Move or remove the questions first.",
      },
      { status: 409 }
    );
  }

  await prisma.topic.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Topic deleted successfully.",
  });
}