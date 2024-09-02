import { dev } from '$app/environment'
import { PrismaAdapter } from '@lucia-auth/adapter-prisma'
import { Lucia } from 'lucia'
import { client } from './db'
import type { Cookies } from '@sveltejs/kit'
import { sha256 } from 'js-sha256'

/*
 * Note: you can replace js-sha256 with node:crypto
 * if running a node backend:
 *
 * import { createHash } from "node:crypto"
 * const hashedEmail = createHash('sha256').update(content).digest('hex')
 */
const buildGravatarUrl = (email: string) => {
  const content = email.trim().toLowerCase()
  const hashedEmail = sha256(content)
  return `https://gravatar.com/avatar/${hashedEmail}?d=mp`
}

const adapter = new PrismaAdapter(client.session, client.user)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: attributes => {
    return {
      email: attributes.email,
      givenName: attributes.givenName,
      familyName: attributes.familyName,
      avatar: buildGravatarUrl(attributes.email),
      initials: attributes.givenName[0] + attributes.familyName[0]
    }
  }
})

export const createSession = async (userId: string, cookies: Cookies): Promise<void> => {
  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  cookies.set(sessionCookie.name, sessionCookie.value, {
    path: '/',
    ...sessionCookie.attributes
  })
}

export type DatabaseUserAttributes = {
  email: string
  givenName: string
  familyName: string
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}
