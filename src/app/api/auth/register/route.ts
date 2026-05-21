import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Prisma Specific Errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }
    
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: "Failed to connect to the database. Please check your connection." }, { status: 503 });
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json({ error: "A database error occurred while processing your request." }, { status: 400 });
    }

    // Generic fallback for other unknown errors (like bcrypt failures)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === "development" ? error.message : undefined 
    }, { status: 500 });
  }
}
