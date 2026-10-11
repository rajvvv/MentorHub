import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) =>
        cookies.forEach((c) => response.cookies.set(c.name, c.value, c.options)),
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/call', '/profile']
  if (!user && protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/call/:path*', '/profile/:path*'],
}
