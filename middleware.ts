import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseMiddleware } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Initialize the Supabase client and get the response object
  const { supabase, response } = await createSupabaseMiddleware(request)
  
  // 2. Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 3. Redirect unauthenticated users to login (except if already on /login)
  if (!user && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // --- THE FIX: Fetch the actual role from the Database ---
    // We query 'profiles' because SQL updates only change this table, 
    // not the user's browser cookie metadata.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'teacher'

    // 4. Handle the Root Path (/) redirect based on role
    if (path === '/') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/teacher', request.url))
    }

    // 5. Protection: Prevent Teachers from accessing /admin
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/teacher', request.url))
    }
    
    // 6. If logged in, don't let them go back to the login page manually
    if (path.startsWith('/login')) {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/teacher', request.url))
    }
  }

  return response
}

// Ensure the middleware matches all paths except static files and specific auth routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/callback|login).*)'],
}