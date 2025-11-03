import { PrismaClient } from "@prisma/client";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
class PrismaDB {
  static #instance;
  static get instance() {
    if (!PrismaDB.#instance) {
      PrismaDB.#instance = new PrismaDB();
    }
    return PrismaDB.#instance;
  }
  #prisma;
  constructor() {
    this.#prisma = new PrismaClient();
  }
  getSession = async (id) => {
    return await this.#prisma.session.findUnique({
      where: {
        id
      },
      include: {
        user: true
      }
    });
  };
  deleteSession = async (id) => {
    await this.#prisma.session.delete({ where: { id } });
  };
  refreshSession = async (id, expiresAt2) => {
    return await this.#prisma.session.update({
      where: {
        id
      },
      data: {
        expiresAt: expiresAt2
      },
      include: {
        user: true
      }
    });
  };
  createSession = async (data) => {
    return await this.#prisma.session.create({ data, include: { user: true } });
  };
  createUser = async (data) => {
    return await this.#prisma.user.create({ data });
  };
  deleteUserByEmail = async (email) => {
    await this.#prisma.user.deleteMany({ where: { email } });
  };
}
const expiresAt = () => new Date(Date.now() + 1e3 * 60 * 60 * 24 * 30);
const setSessionTokenCookie = (cookies, token) => {
  cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt(),
    path: "/"
  });
};
const deleteSessionTokenCookie = (cookies) => {
  cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
};
class SessionManager {
  db;
  constructor(db) {
    this.db = db;
  }
  static generateSessionToken = () => {
    return crypto.randomUUID();
  };
  createUser = async (data) => {
    return await this.db.createUser(data);
  };
  createSession = async (data) => {
    const { userId } = data;
    const token = data.token ?? SessionManager.generateSessionToken();
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session = await this.db.createSession({
      id: sessionId,
      userId,
      expiresAt: expiresAt()
    });
    return { ...session, token };
  };
  validateSessionToken = async (token) => {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session = await this.db.getSession(sessionId);
    if (session === null) {
      return null;
    }
    if (Date.now() >= session.expiresAt.getTime()) {
      await this.db.deleteSession(sessionId);
      return null;
    }
    if (Date.now() >= session.expiresAt.getTime() - 1e3 * 60 * 60 * 24 * 15) {
      session.expiresAt = new Date(Date.now() + 1e3 * 60 * 60 * 24 * 30);
      await this.db.refreshSession(sessionId, session.expiresAt);
    }
    return { ...session, token };
  };
  invalidateSession = async (token) => {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    await this.db.deleteSession(sessionId);
  };
  setSessionTokenCookie = setSessionTokenCookie;
  deleteSessionTokenCookie = deleteSessionTokenCookie;
}
const sessionManager = new SessionManager(PrismaDB.instance);
export {
  sessionManager as s
};
