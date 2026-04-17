import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // email 없이도 동작 (카카오는 email 미제공 가능)
      // user_metadata에서 닉네임/아바타 추출 (signup 페이지에서 upsert 시 사용)
      // const nickname  = user.user_metadata?.name
      //                || user.user_metadata?.full_name
      //                || user.user_metadata?.preferred_username
      //                || null
      // const avatarUrl = user.user_metadata?.avatar_url
      //                || user.user_metadata?.picture
      //                || null

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()   // single() → maybeSingle() : 결과 없을 때 에러 대신 null 반환

      if (!existingUser) {
        return NextResponse.redirect(`${origin}/signup`)
      }
      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}