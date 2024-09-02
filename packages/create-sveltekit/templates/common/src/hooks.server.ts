import { login } from '$lib/routes'
import { lucia } from '$lib/server/auth'
import { redirect, type Handle } from '@sveltejs/kit'

// protect /todos
const isProtectedRoute = (routeId: string | null) => routeId?.startsWith('/(app)')

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName)

  if (!sessionId && isProtectedRoute(event.route.id)) {
    return redirect(302, '/login')
  } else if (!sessionId) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } = await lucia.validateSession(sessionId)

  if (session && session.fresh) {
    // update the cookie with the new session id
    const sessionCookie = lucia.createSessionCookie(session.id)
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    })
  }

  if (!session) {
    // session id was invalid so set a blank cookie
    const sessionCookie = lucia.createBlankSessionCookie()
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    })
  }

  event.locals.user = user
  event.locals.session = session

  if (isProtectedRoute(event.route.id) && event.locals.user) {
    return resolve(event)
  } else if (isProtectedRoute(event.route.id)) {
    redirect(302, login)
  } else {
    return resolve(event)
  }
}
