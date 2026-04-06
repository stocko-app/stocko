import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // rotas públicas — deixa passar sempre
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();

  // verifica token no cookie (definido no login/registo)
  const token = request.cookies.get("stocko_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/rankings/:path*", "/leagues/:path*", "/profile/:path*"],
};
