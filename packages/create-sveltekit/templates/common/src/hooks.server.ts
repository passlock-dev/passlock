import { login } from '$lib/routes'
import { lucia } from '$lib/server/auth'
import { initLucia } from '$lib/server/db'
import { redirect, type Handle } from '@sveltejs/kit'

const isProtectedRoute = (routeId: string | null) => routeId?.startsWith('/(app)')

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName)

  if (!sessionId && isProtectedRoute(event.route.id)) {
    return redirect(302, '/')
  } else if (!sessionId) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } = await lucia.validateSession(sessionId)

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id)
    // sveltekit types deviates from the de-facto standard
    // you can use 'as any' too
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    })
  }

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie()
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    })
  }

  event.locals.user = user || null
  event.locals.session = session || null

  if (isProtectedRoute(event.route.id) && event.locals.user) {
    return resolve(event)
  } else if (isProtectedRoute(event.route.id)) {
    redirect(302, login)
  } else {
    return resolve(event)
  }
}

initLucia()
