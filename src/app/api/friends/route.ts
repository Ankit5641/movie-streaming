import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    const formattedFriends = friendships.map(f => {
      const isSender = f.senderId === session.user.id;
      const friend = isSender ? f.receiver : f.sender;
      return {
        id: f.id,
        status: f.status,
        isIncoming: !isSender,
        friend
      };
    });

    return NextResponse.json({ friends: formattedFriends }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, action, friendshipId } = await req.json();

    if (action === "request") {
      const targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (targetUser.id === session.user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: targetUser.id },
            { senderId: targetUser.id, receiverId: session.user.id }
          ]
        }
      });

      if (existing) return NextResponse.json({ error: "Friendship already exists" }, { status: 400 });

      const friendship = await prisma.friendship.create({
        data: {
          senderId: session.user.id,
          receiverId: targetUser.id,
          status: "PENDING"
        },
        include: { receiver: true }
      });

      return NextResponse.json({ message: "Request sent", friendship }, { status: 200 });
    }

    if (action === "accept" && friendshipId) {
      await prisma.friendship.updateMany({
        where: { id: friendshipId, receiverId: session.user.id },
        data: { status: "ACCEPTED" }
      });
      return NextResponse.json({ message: "Request accepted" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
