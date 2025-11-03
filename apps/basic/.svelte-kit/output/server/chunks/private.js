import { a as PasslockError, E as ErrorCode, p as pipe, r as runPromise, m as match, g as flatMap, h as decodePrincipal, i as mapError, T as TreeFormatter, t as tryPromise, P as Passlock } from "./public.js";
const PASSLOCK_CLIENT_VERSION = "#{LATEST}#";
const delayPromise = (p) => {
  return new Promise((resolve) => {
    setTimeout(resolve, 100);
  }).then(p);
};
class TokenVerifier {
  tenancyId;
  apiKey;
  endpoint;
  constructor(props) {
    this.tenancyId = props.tenancyId;
    this.apiKey = props.apiKey;
    this.endpoint = props.endpoint;
  }
  _exchangeToken = async (token, retryCount = 0) => {
    const endpoint = this.endpoint ?? "https://api.passlock.dev";
    const url = `${endpoint}/${this.tenancyId}/token/${token}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "X-PASSLOCK-CLIENT-VERSION": PASSLOCK_CLIENT_VERSION
    };
    const response = await fetch(url, { headers });
    if (!response.ok && response.status >= 500 && retryCount < 5) {
      const errorMessage = await response.json();
      console.warn(errorMessage);
      console.warn("Retrying...");
      await delayPromise(() => this._exchangeToken(token, retryCount + 1));
    }
    if (!response.ok) {
      const errorMessage = await response.json();
      return new PasslockError("Unable to exchange token with Passlock backend", ErrorCode.InternalServerError, errorMessage);
    } else {
      return pipe(tryPromise(() => response.json()), mapError(() => new PasslockError("Unable to exchange token with Passlock backend", ErrorCode.InternalServerError)), flatMap((json) => pipe(decodePrincipal(json), mapError((err) => new PasslockError("Unable to exchange token with Passlock backend", ErrorCode.InternalServerError, TreeFormatter.formatErrorSync(err))))), match({
        onFailure: (err) => err,
        onSuccess: (value) => value
      }), runPromise);
    }
  };
  /**
   * Call the Passlock REST API to exchange the token for a principal.
   *
   * Coming Soon - local JWT based verification (avoiding the network trip).
   *
   * @param token
   * @returns
   */
  exchangeToken = async (token) => this._exchangeToken(token, 0);
  exchangeUserToken = async (token) => {
    const principal = await this.exchangeToken(token);
    if (PasslockError.isError(principal))
      return principal;
    if (!Passlock.isUserPrincipal(principal))
      return new PasslockError("No user details returned from Passlock backend", ErrorCode.InternalServerError);
    return principal;
  };
}
const getToken = async (request) => {
  let formData = null;
  if ("formData" in request) {
    formData = await request.formData();
  } else {
    formData = request;
  }
  const token = formData.get("token");
  if (token !== null && typeof token === "string") {
    return token;
  } else {
    return null;
  }
};
const isUserPrincipal = (value) => Passlock.isUserPrincipal(value);
const PASSLOCK_API_KEY = "h0krpm3h4-smrf14z7k-qga2gbk9z";
export {
  PASSLOCK_API_KEY as P,
  TokenVerifier as T,
  getToken as g,
  isUserPrincipal as i
};
