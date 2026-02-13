import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected Routes & Role-Based Access Control
  const path = request.nextUrl?.pathname || '';
  
  if (!user && (path.startsWith('/admin') || path.startsWith('/driver') || path.startsWith('/restaurant') || path.startsWith('/customer') || path.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in, check role
  if (user) {
    const role = user.user_metadata.role as string;
    
    // Status Check (HR / Onboarding)
    if (role === 'driver' || role === 'restaurant') {
        const { data: dbUser } = await supabase
            .from('users')
            .select('status')
            .eq('id', user.id)
            .single();
        
        const status = dbUser?.status || 'draft';
        const isOnboarding = path.startsWith('/onboarding');
        const isOperational = path.startsWith(`/${role}`);

        // If not approved, force to onboarding (unless already there or calling API)
        if (status !== 'approved' && isOperational) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        // If approved, prevent access to onboarding (redirect to dashboard)
        if (status === 'approved' && isOnboarding) {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
    }

    // Admin routes
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Driver routes
    if (path.startsWith('/driver') && role !== 'driver' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Restaurant routes
    if (path.startsWith('/restaurant') && role !== 'restaurant' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Customer routes
    if (path.startsWith('/customer') && role !== 'customer' && role !== 'admin') {
      // Allow admin to access customer view
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect logged-in users away from auth pages
    if (path === '/login' || path === '/register') {
       if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
       if (role === 'driver') return NextResponse.redirect(new URL('/driver', request.url));
       if (role === 'restaurant') return NextResponse.redirect(new URL('/restaurant', request.url));
       return NextResponse.redirect(new URL('/customer', request.url));
    }
  }

  return response
}
