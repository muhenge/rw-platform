import { NextRequest, NextResponse } from "next/server";

// Simplified middleware.ts - just handle public routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (["/signin", "/signup"].includes(pathname)) {
    return NextResponse.next();
  }
}
