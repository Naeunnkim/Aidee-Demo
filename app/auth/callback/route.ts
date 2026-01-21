// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // 서버 컴포넌트 환경에서는 set/remove가 가끔 제한될 수 있으므로 try-catch로 감싸거나
            // 단순히 쿠키를 설정하도록 명시합니다.
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // 미들웨어 등에서 처리할 수 있도록 무시해도 되는 경우가 많습니다.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.delete({ name, ...options })
            } catch (error) {
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 성공 시 메인 페이지로 이동
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // 실패 시 에러 메시지와 함께 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}