import { s as sessionManager } from "./index4.js";
const handle = async ({ event, resolve }) => {
  const token = event.cookies.get("session") ?? null;
  if (token === null) {
    event.locals.session = null;
    return resolve(event);
  }
  const session = await sessionManager.validateSessionToken(token);
  if (session !== null) {
    sessionManager.setSessionTokenCookie(event.cookies, token);
  } else {
    sessionManager.deleteSessionTokenCookie(event.cookies);
  }
  event.locals.session = session;
  return resolve(event);
};
export {
  handle
};
