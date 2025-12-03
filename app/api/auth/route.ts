import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    // VERY simple demo auth
    if (username === "admin" && password === "1234") {
      return NextResponse.json({ success: true, name: "Admin User", token: "demo-token-abc" });
    }
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
  }
}
