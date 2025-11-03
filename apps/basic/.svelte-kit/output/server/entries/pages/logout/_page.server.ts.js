import { s as sessionManager } from "../../../chunks/index4.js";
import { r as redirect } from "../../../chunks/index2.js";
const load = async () => {
  return {};
};
const actions = {
  default: async ({ cookies, locals }) => {
    if (locals.session) {
      await sessionManager.validateSessionToken(locals.session.token);
      sessionManager.deleteSessionTokenCookie(cookies);
    }
    redirect(302, "/login");
  }
};
export {
  actions,
  load
};
