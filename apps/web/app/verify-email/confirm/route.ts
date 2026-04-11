import { NextResponse } from "next/server";
import { verifyEmailToken } from "../../../lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", request.url));
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/verify-email?error=${result.code === "expired_token" ? "expired" : "invalid"}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL("/login?verified=1", request.url));
}
