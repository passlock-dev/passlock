import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import type { Cookies } from "@sveltejs/kit";

export type User = {
  id: string
}

export type Session = {
  id: string
  userId: string
  expiresAt: Date
}

export type Prisma<S extends Session, U extends User> = {
  session: {
    create: (props: { 
      data: S 
    }) => Promise<S>

    update: (props: {
      where: {
        id: string
      },
      data: {
        expiresAt: Date
      }
    }) => Promise<S | null>

    findUnique: (props: {
      where: {
        id: string
      },
      include: {
        user: true
      }
    }) => Promise<S & { user: U } | null>

    delete: (props: {
      where: {
        id: string
      }
    }) => Promise<S | null>

    deleteMany: (props: {
      where: {
        userId: string
      }
    }) => Promise<{ count: number }>
  }
}

export class SessionManager<S extends Session, U extends User> {
  private readonly prisma: Prisma<S, U>

  constructor(prisma: Prisma<S, U>) {
    this.prisma = prisma
  }

  readonly generateSessionToken = (): string => {
    const bytes = new Uint8Array(20)
    crypto.getRandomValues(bytes)
    const token = encodeBase32LowerCaseNoPadding(bytes)
    return token
  }

  readonly createSession = async (props: Omit<S, 'id' | 'expiresAt'> & { token: string }): Promise<S> => {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(props.token)));
  
    const createSession: S = {
      ...props,
      id: sessionId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    } as unknown as S;

    const session = await this.prisma.session.create({ data: createSession })
  
    return session;
  }

  readonly validateSessionToken = async (token: string): Promise<S & { user: U } | null> => {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    const session = await this.prisma.session.findUnique({
      where: {
        id: sessionId
      },
      include: {
        user: true
      }
    });

    if (session === null) {
      return null
    }

    if (Date.now() >= session.expiresAt.getTime()) {
      await this.prisma.session.delete({ where: { id: sessionId }});
      return null
    }

    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
      session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      await this.prisma.session.update({
        where: {
          id: session.id
        },
        data: {
          expiresAt: session.expiresAt
        }
      });
    }

    return session;
  }

  readonly invalidateSession = async (sessionId: string): Promise<void> => {
    await this.prisma.session.delete({ where: { id: sessionId }})
  }

  readonly invalidateUserSessions = async (userId: string): Promise<void> => {
    await this.prisma.session.deleteMany({ where: { userId }})
  }

  readonly setSessionCookie = (props: { cookies: Cookies, token: string, expiresAt: Date }): void => {
    props.cookies.set("session", props.token, {
      httpOnly: true,
      sameSite: "lax",
      expires: props.expiresAt,
      path: "/"
    })
  }
  
  readonly deleteSessionCookie = (cookies: Cookies): void => {
    cookies.set("session", "", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/"
    })
  }
}