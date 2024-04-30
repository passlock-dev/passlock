import { Lucia } from 'lucia'
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite'
import { dev } from '$app/environment'
import { db } from './db'
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

/**
 * Swap this for a more robust implementation
 */
const adapter = new BetterSqlite3Adapter(db, {
  user: 'user',
  session: 'session'
})

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: attributes => {
    return {
      email: attributes.email,
      givenName: attributes.given_name,
      familyName: attributes.family_name,
      avatar: buildGravatarUrl(attributes.email),
      initials: attributes.given_name[0] + attributes.family_name[0]
    }
  }
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

interface DatabaseUserAttributes {
  email: string
  given_name: string
  family_name: string
}
