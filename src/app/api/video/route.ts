import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, url } = await req.json();

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        title,
        url,
        uploaderId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Video saved", video }, { status: 201 });
  } catch (error) {
    console.error("Database save error:", error);
    return NextResponse.json({ error: "Failed to save video metadata" }, { status: 500 });
  }
}
