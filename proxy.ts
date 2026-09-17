import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function verifyProfessorCookie(token: string): Promise<boolean> {
  try {
    const sec = process.env.PROFESSOR_JWT_SECRET
    if (!sec) return false
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return false
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(sec),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const toB64 = (s: string) => {
      s = s.replace(/-/g, '+').replace(/_/g, '/')
      while (s.length % 4) s += '='
      return s
    }
    const sigBytes = Uint8Array.from(atob(toB64(sig)), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload))
    if (!valid) return false
    const { exp } = JSON.parse(atob(toB64(payload)))
    return Date.now() < exp
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Rotas do portal do professor ──────────────────────────────────────────
  // Só rotas /professor e /professor/* — NÃO /professores (área admin)
  const isProfessorPortal = /^\/professor(\/|$)/.test(pathname) || pathname.startsWith('/api/professor')
  // Rotas públicas do portal (sem cookie)
  const isProfessorPublic = pathname === '/professor/login'
    || pathname === '/professor/esqueci-senha'
    || pathname === '/professor/redefinir-senha'
    || pathname === '/api/professor/login'
    || pathname === '/api/professor/logout'
    || pathname === '/api/professor/forgot-password'
    || pathname === '/api/professor/reset-password'

  if (isProfessorPortal) {
    if (isProfessorPublic) return NextResponse.next()
    const token = request.cookies.get('professor_token')?.value
    const valid = token ? await verifyProfessorCookie(token) : false
    if (!valid) {
      const url = request.nextUrl.clone()
      url.pathname = '/professor/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Rotas do admin (Supabase auth) ────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage  = pathname.startsWith('/login')
    || pathname.startsWith('/esqueci-senha')
    || pathname.startsWith('/redefinir-senha')
  const isPublicApi = pathname.startsWith('/api/zoom/webhook')

  if (!user && !isAuthPage && !isPublicApi) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
