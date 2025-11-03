import { S as store_get, T as unsubscribe_stores, R as pop, P as push } from "../../../chunks/index.js";
import { w as writable, d as derived } from "../../../chunks/index3.js";
import { P as Passlock, a as PasslockError, b as PUBLIC_APPLE_CLIENT_ID, c as PUBLIC_GOOGLE_CLIENT_ID, d as PUBLIC_PASSLOCK_TENANCY_ID, e as PUBLIC_PASSLOCK_CLIENT_ID, f as PUBLIC_PASSLOCK_ENDPOINT } from "../../../chunks/public.js";
import { g as getFormValue, e as enhance, A as Apple, G as Google, P as Passkey_logo, S as Spinner, a as Apple_logo, b as Google_logo } from "../../../chunks/passkey-logo.js";
import { i as invalidateAll, a as applyAction, e as escape_html } from "../../../chunks/client.js";
import { a as attr } from "../../../chunks/attributes.js";
async function tick() {
}
const defaultMappings = {
  email: "email",
  token: "token"
};
const authenticate = (config, options = {}) => {
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
        applyAction();
      };
    }
    const email = getValue("email");
    const userVerification = options?.userVerification;
    const result = await client.authenticatePasskey({ email, userVerification }, options);
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
      applyAction();
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
    operation: "authentication",
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
    useOneTap: false
  };
  let token = "";
  let email = "";
  const { enhance: enhance2, passlockError, submitting } = authenticate(passlockConfig);
  const error = derived(passlockError, ($e) => $e?.message);
  const onPrincipal = async (principal) => {
    token = principal.token;
    email = principal.email;
    await tick();
  };
  $$payload.out += `<div class="centered"><div class="panel"><div><h1 class="text-center">Sign in with</h1> <div class="socials">`;
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
  $$payload.out += `<!----></div></div> <div class="divider">Or</div> <form class="registration_form" method="post"><fieldset><div><label for="email">Email</label> <input type="email" id="email" name="email"${attr("value", email)} required></div> <button class="primary" type="submit" tabindex="0">`;
  Passkey_logo($$payload);
  $$payload.out += `<!----> Sign in with Passkey `;
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
