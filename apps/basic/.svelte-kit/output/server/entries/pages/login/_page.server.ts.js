import { e as error, r as redirect } from "../../../chunks/index2.js";
import { T as TokenVerifier, P as PASSLOCK_API_KEY, g as getToken, i as isUserPrincipal } from "../../../chunks/private.js";
import { d as PUBLIC_PASSLOCK_TENANCY_ID, f as PUBLIC_PASSLOCK_ENDPOINT, a as PasslockError } from "../../../chunks/public.js";
import { s as sessionManager } from "../../../chunks/index4.js";
const tokenVerifier = new TokenVerifier({
  tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
  apiKey: PASSLOCK_API_KEY,
  endpoint: PUBLIC_PASSLOCK_ENDPOINT
});
const load = async () => {
  return {};
};
const actions = {
  default: async ({ request, cookies }) => {
    const token = await getToken(request);
    if (!token) error(500, "Sorry something went wrong");
    const result = await tokenVerifier.exchangeToken(token);
    if (PasslockError.isError(result)) error(400, result.message);
    if (!isUserPrincipal(result)) error(400, "Expected a user");
    const session = await sessionManager.createSession({ userId: result.sub });
    sessionManager.setSessionTokenCookie(cookies, session.token);
    redirect(302, "/");
  }
};
export {
  actions,
  load
};
