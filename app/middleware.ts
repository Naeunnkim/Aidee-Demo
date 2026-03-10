import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookies = await request.cookies
          return cookies.get(name)?.value
        },
        async set(name: string, value: string, options: any) {
          const cookies = await request.cookies
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        async remove(name: string, options: any) {
          const cookies = await request.cookies
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 세션 정보를 확인하여 인증 상태를 갱신합니다
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (아이콘 파일)
     * - public 폴더 내 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}