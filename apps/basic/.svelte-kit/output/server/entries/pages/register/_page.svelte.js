import { S as store_get, T as unsubscribe_stores, R as pop, P as push } from "../../../chunks/index.js";
import { w as writable, d as derived } from "../../../chunks/index3.js";
import { P as Passlock, a as PasslockError, E as ErrorCode, b as PUBLIC_APPLE_CLIENT_ID, c as PUBLIC_GOOGLE_CLIENT_ID, d as PUBLIC_PASSLOCK_TENANCY_ID, e as PUBLIC_PASSLOCK_CLIENT_ID, f as PUBLIC_PASSLOCK_ENDPOINT } from "../../../chunks/public.js";
import { i as invalidateAll, a as applyAction, e as escape_html } from "../../../chunks/client.js";
import { g as getFormValue, e as enhance, A as Apple, G as Google, P as Passkey_logo, S as Spinner, a as Apple_logo, b as Google_logo } from "../../../chunks/passkey-logo.js";
import { a as attr } from "../../../chunks/attributes.js";
const defaultMappings = {
  email: "email",
  givenName: "givenName",
  familyName: "familyName",
  token: "token"
};
const register = (config, options = {}) => {
  const client = new Passlock(config);
  const passlockError = writable();
  const token = writable();
  const submitting = writable(false);
  const submitHandler = async ({ formData, cancel }) => {
    passlockError.set(void 0);
    submitting.set(true);
    const getValue = getFormValue(options.mappings ?? defaultMappings, formData);
    const token2 = getValue("token");
    if (token2) {
      return async ({ result: result2 }) => {
        submitting.set(false);
        await invalidateAll();
        await applyAction();
      };
    }
    const email = getValue("email");
    const givenName = getValue("givenName");
    const familyName = getValue("familyName");
    const userVerification = options?.userVerification;
    if (!email) {
      passlockError.set(new PasslockError("Email is required", ErrorCode.BadRequest));
      return;
    }
    const result = await client.registerPasskey({
      email,
      givenName,
      familyName,
      userVerification
    }, options);
    if (PasslockError.isError(result)) {
      cancel();
      passlockError.set(result);
      submitting.set(false);
    } else if (Passlock.isPrincipal(result)) {
      const formKey = options.mappings?.token ?? defaultMappings.token;
      formData.set(formKey, result.token);
    }
    return async ({ result: result2 }) => {
      submitting.set(false);
      await invalidateAll();
      await applyAction();
    };
  };
  const enhance$1 = (el) => {
    return enhance(el, submitHandler);
  };
  return {
    submitHandler,
    enhance: enhance$1,
    token,
    passlockError,
    submitting
  };
};
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const passlockConfig = {
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT
  };
  const appleConfig = {
    ...passlockConfig,
    operation: "registration",
    appleClientId: PUBLIC_APPLE_CLIENT_ID,
    appleRedirectURL: ""
  };
  const googleConfig = {
    ...passlockConfig,
    operation: "registration",
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
    useOneTap: false
  };
  let email = "";
  let givenName = "";
  let familyName = "";
  let token = "";
  let authenticatorType = "";
  const { enhance: enhance2, passlockError, submitting } = register(passlockConfig);
  const error = derived(passlockError, ($e) => $e?.message);
  const onPrincipal = (principal) => {
    token = principal.token;
    email = principal.email;
    givenName = principal.givenName;
    familyName = principal.familyName;
    authenticatorType = principal.authenticatorType;
  };
  $$payload.out += `<div class="centered"><div class="panel"><div><h1 class="text-center">Sign up with</h1> <div class="socials">`;
  {
    let children = function($$payload2, { click, submitting: submitting2 }) {
      $$payload2.out += `<button class="button social" tabindex="0">`;
      Apple_logo($$payload2);
      $$payload2.out += `<!----> Apple `;
      if (submitting2) {
        $$payload2.out += "<!--[-->";
        Spinner($$payload2);
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></button>`;
    };
    Apple($$payload, {
      config: appleConfig,
      onprincipal: onPrincipal,
      children,
      $$slots: { default: true }
    });
  }
  $$payload.out += `<!----> `;
  {
    let children = function($$payload2, { click, submitting: submitting2 }) {
      $$payload2.out += `<button class="button social" tabindex="0">`;
      Google_logo($$payload2);
      $$payload2.out += `<!----> Google `;
      if (submitting2) {
        $$payload2.out += "<!--[-->";
        Spinner($$payload2);
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></button>`;
    };
    Google($$payload, {
      config: googleConfig,
      onprincipal: onPrincipal,
      children,
      $$slots: { default: true }
    });
  }
  $$payload.out += `<!----></div></div> <div class="divider">Or</div> <form method="post"><fieldset><div><label for="email">Email</label> <input type="email" id="email" name="email"${attr("value", email)} required></div> <div><label for="givenName">First name</label> <input type="text" id="givenName" name="givenName"${attr("value", givenName)} required></div> <div><label for="familyName">Last name</label> <input type="text" id="familyName" name="familyName"${attr("value", familyName)} required></div> <label for="terms" class="terms svelte-r69pfo"><input type="checkbox" id="terms" name="terms" required tabindex="0"> <span>I accept the <a href="#">terms and conditions</a></span></label> <button class="primary" type="submit" tabindex="0">`;
  if (authenticatorType === "apple" || authenticatorType === "google") {
    $$payload.out += "<!--[-->";
    $$payload.out += `Register`;
  } else {
    $$payload.out += "<!--[!-->";
    Passkey_logo($$payload);
    $$payload.out += `<!----> Create Passkey`;
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$submitting", submitting)) {
    $$payload.out += "<!--[-->";
    Spinner($$payload);
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></button> `;
  if (store_get($$store_subs ??= {}, "$error", error)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="error">${escape_html(store_get($$store_subs ??= {}, "$error", error))}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></fieldset> <input type="hidden" name="token"${attr("value", token)}></form></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
