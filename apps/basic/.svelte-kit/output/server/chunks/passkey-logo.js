import { P as Passlock, a as PasslockError } from "./public.js";
import { i as invalidateAll, a as applyAction } from "./client.js";
import { U as UNDEFINED, N as NAN, P as POSITIVE_INFINITY, a as NEGATIVE_INFINITY, b as NEGATIVE_ZERO, c as decode64, H as HOLE } from "./index3.js";
import { R as pop, P as push } from "./index.js";
function parse(serialized, revivers) {
  return unflatten(JSON.parse(serialized));
}
function unflatten(parsed, revivers) {
  if (typeof parsed === "number") return hydrate(parsed, true);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid input");
  }
  const values = (
    /** @type {any[]} */
    parsed
  );
  const hydrated = Array(values.length);
  function hydrate(index, standalone = false) {
    if (index === UNDEFINED) return void 0;
    if (index === NAN) return NaN;
    if (index === POSITIVE_INFINITY) return Infinity;
    if (index === NEGATIVE_INFINITY) return -Infinity;
    if (index === NEGATIVE_ZERO) return -0;
    if (standalone) throw new Error(`Invalid input`);
    if (index in hydrated) return hydrated[index];
    const value = values[index];
    if (!value || typeof value !== "object") {
      hydrated[index] = value;
    } else if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const type = value[0];
        switch (type) {
          case "Date":
            hydrated[index] = new Date(value[1]);
            break;
          case "Set":
            const set = /* @__PURE__ */ new Set();
            hydrated[index] = set;
            for (let i = 1; i < value.length; i += 1) {
              set.add(hydrate(value[i]));
            }
            break;
          case "Map":
            const map = /* @__PURE__ */ new Map();
            hydrated[index] = map;
            for (let i = 1; i < value.length; i += 2) {
              map.set(hydrate(value[i]), hydrate(value[i + 1]));
            }
            break;
          case "RegExp":
            hydrated[index] = new RegExp(value[1], value[2]);
            break;
          case "Object":
            hydrated[index] = Object(value[1]);
            break;
          case "BigInt":
            hydrated[index] = BigInt(value[1]);
            break;
          case "null":
            const obj = /* @__PURE__ */ Object.create(null);
            hydrated[index] = obj;
            for (let i = 1; i < value.length; i += 2) {
              obj[value[i]] = hydrate(value[i + 1]);
            }
            break;
          case "Int8Array":
          case "Uint8Array":
          case "Uint8ClampedArray":
          case "Int16Array":
          case "Uint16Array":
          case "Int32Array":
          case "Uint32Array":
          case "Float32Array":
          case "Float64Array":
          case "BigInt64Array":
          case "BigUint64Array": {
            const TypedArrayConstructor = globalThis[type];
            const base64 = value[1];
            const arraybuffer = decode64(base64);
            const typedArray = new TypedArrayConstructor(arraybuffer);
            hydrated[index] = typedArray;
            break;
          }
          case "ArrayBuffer": {
            const base64 = value[1];
            const arraybuffer = decode64(base64);
            hydrated[index] = arraybuffer;
            break;
          }
          default:
            throw new Error(`Unknown type ${type}`);
        }
      } else {
        const array = new Array(value.length);
        hydrated[index] = array;
        for (let i = 0; i < value.length; i += 1) {
          const n = value[i];
          if (n === HOLE) continue;
          array[i] = hydrate(n);
        }
      }
    } else {
      const object = {};
      hydrated[index] = object;
      for (const key in value) {
        const n = value[key];
        object[key] = hydrate(n);
      }
    }
    return hydrated[index];
  }
  return hydrate(0);
}
const getFormValue = (mappings, formData) => (mappingKey) => {
  const formKey = mappings[mappingKey] || mappingKey;
  const value = formData.get(formKey) || void 0;
  return typeof value === "string" ? value : void 0;
};
function deserialize(result) {
  const parsed = JSON.parse(result);
  if (parsed.data) {
    parsed.data = parse(parsed.data);
  }
  return parsed;
}
function clone(element) {
  return (
    /** @type {T} */
    HTMLElement.prototype.cloneNode.call(element)
  );
}
function enhance(form_element, submit = () => {
}) {
  const fallback_callback = async ({
    action,
    result,
    reset = true,
    invalidateAll: shouldInvalidateAll = true
  }) => {
    if (result.type === "success") {
      if (reset) {
        HTMLFormElement.prototype.reset.call(form_element);
      }
      if (shouldInvalidateAll) {
        await invalidateAll();
      }
    }
    if (location.origin + location.pathname === action.origin + action.pathname || result.type === "redirect" || result.type === "error") {
      applyAction();
    }
  };
  async function handle_submit(event) {
    const method = event.submitter?.hasAttribute("formmethod") ? (
      /** @type {HTMLButtonElement | HTMLInputElement} */
      event.submitter.formMethod
    ) : clone(form_element).method;
    if (method !== "post") return;
    event.preventDefault();
    const action = new URL(
      // We can't do submitter.formAction directly because that property is always set
      event.submitter?.hasAttribute("formaction") ? (
        /** @type {HTMLButtonElement | HTMLInputElement} */
        event.submitter.formAction
      ) : clone(form_element).action
    );
    const enctype = event.submitter?.hasAttribute("formenctype") ? (
      /** @type {HTMLButtonElement | HTMLInputElement} */
      event.submitter.formEnctype
    ) : clone(form_element).enctype;
    const form_data = new FormData(form_element);
    const submitter_name = event.submitter?.getAttribute("name");
    if (submitter_name) {
      form_data.append(submitter_name, event.submitter?.getAttribute("value") ?? "");
    }
    const controller = new AbortController();
    let cancelled = false;
    const cancel = () => cancelled = true;
    const callback = await submit({
      action,
      cancel,
      controller,
      formData: form_data,
      formElement: form_element,
      submitter: event.submitter
    }) ?? fallback_callback;
    if (cancelled) return;
    let result;
    try {
      const headers = new Headers({
        accept: "application/json",
        "x-sveltekit-action": "true"
      });
      if (enctype !== "multipart/form-data") {
        headers.set(
          "Content-Type",
          /^(:?application\/x-www-form-urlencoded|text\/plain)$/.test(enctype) ? enctype : "application/x-www-form-urlencoded"
        );
      }
      const body = enctype === "multipart/form-data" ? form_data : new URLSearchParams(form_data);
      const response = await fetch(action, {
        method: "POST",
        headers,
        cache: "no-store",
        body,
        signal: controller.signal
      });
      result = deserialize(await response.text());
      if (result.type === "error") result.status = response.status;
    } catch (error) {
      if (
        /** @type {any} */
        error?.name === "AbortError"
      ) return;
      result = { type: "error", error };
    }
    callback({
      action,
      formData: form_data,
      formElement: form_element,
      update: (opts) => fallback_callback({
        action,
        result,
        reset: opts?.reset,
        invalidateAll: opts?.invalidateAll
      }),
      // @ts-expect-error generic constraints stuff we don't care about
      result
    });
  }
  HTMLFormElement.prototype.addEventListener.call(form_element, "submit", handle_submit);
  return {
    destroy() {
      HTMLFormElement.prototype.removeEventListener.call(form_element, "submit", handle_submit);
    }
  };
}
function Apple($$payload, $$props) {
  push();
  let { config, error, children, onprincipal } = $$props;
  let submitting = false;
  let errorMessage = "";
  const passlock = new Passlock(config);
  const appleScripts = () => {
    return new Promise((resolve) => {
      if (typeof AppleID !== "undefined" && AppleID !== null) {
        resolve();
      } else {
        const interval = setInterval(
          () => {
            if (typeof AppleID !== "undefined" && AppleID !== null) {
              clearInterval(interval);
              resolve();
            }
          },
          100
        );
      }
    });
  };
  const callPasslock = async (nonce, res) => {
    if (config.operation === "registration" && res.user) {
      return await passlock.registerOidc({
        provider: "apple",
        idToken: res.authorization.id_token,
        givenName: res.user.name.firstName,
        familyName: res.user.name.lastName,
        nonce
      });
    } else if (config.operation === "authentication") {
      return await passlock.authenticateOidc({
        provider: "apple",
        idToken: res.authorization.id_token,
        nonce
      });
    } else {
      return new Error("No first_name or last_name returned by Apple");
    }
  };
  const verifyToken = async (nonce, res) => {
    const result = await callPasslock(nonce, res);
    if (Passlock.isUserPrincipal(result)) {
      submitting = false;
      onprincipal(result);
    } else if (PasslockError.isError(result) && result.detail) {
      submitting = false;
      errorMessage = `${result.message}. ${result.detail}`.trim();
    } else if (PasslockError.isError(result)) {
      submitting = false;
      errorMessage = result.message;
    } else {
      submitting = false;
      errorMessage = "Sorry something went wrong";
    }
  };
  const signIn = async () => {
    try {
      errorMessage = "";
      submitting = true;
      await appleScripts();
      await new Promise((resolve) => setTimeout(resolve, 20));
      const baseURL = window.location.protocol + "//" + window.location.host;
      AppleID.auth.init({
        clientId: config.appleClientId,
        scope: "name email",
        redirectURI: config.appleRedirectURL || baseURL,
        usePopup: true
      });
      const nonce = crypto.randomUUID();
      const appleResponse = await AppleID.auth.signIn({ nonce });
      await verifyToken(nonce, appleResponse);
    } catch (err) {
      console.error(err);
      submitting = false;
      errorMessage = "Sorry, something went wrong";
    }
  };
  const click = async () => {
    await signIn();
  };
  if (children) {
    $$payload.out += "<!--[-->";
    children($$payload, { click, submitting });
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (error) {
    $$payload.out += "<!--[-->";
    error($$payload, { error: errorMessage });
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function Google($$payload, $$props) {
  push();
  let { config, error, children, onprincipal } = $$props;
  let submitting = false;
  let errorMessage = "";
  new Passlock(config);
  const click = () => {
    errorMessage = "";
  };
  if (children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div style="display:none"></div> `;
    children($$payload, { click, submitting });
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div></div>`;
  }
  $$payload.out += `<!--]--> `;
  if (error) {
    $$payload.out += "<!--[-->";
    error($$payload, { error: errorMessage });
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function Spinner($$payload) {
  $$payload.out += `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><style>
    .spinner_P7sC {
      transform-origin: center;
      animation: spinner_svv2 0.75s infinite linear;
    }
    @keyframes spinner_svv2 {
      100% {
        transform: rotate(360deg);
      }
    }
  </style><path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" class="spinner_P7sC"></path></svg>`;
}
function Apple_logo($$payload) {
  $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path></svg>`;
}
function Google_logo($$payload) {
  $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 488 512"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>`;
}
function Passkey_logo($$payload) {
  $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><g id="icon-passkey"><circle id="icon-passkey-head" cx="10.5" cy="6" r="4.5"></circle><path id="icon-passkey-key" d="M22.5,10.5a3.5,3.5,0,1,0-5,3.15V19L19,20.5,21.5,18,20,16.5,21.5,15l-1.24-1.24A3.5,3.5,0,0,0,22.5,10.5Zm-3.5,0a1,1,0,1,1,1-1A1,1,0,0,1,19,10.5Z"></path><path id="icon-passkey-body" d="M14.44,12.52A6,6,0,0,0,12,12H9a6,6,0,0,0-6,6v2H16V14.49A5.16,5.16,0,0,1,14.44,12.52Z"></path></g></svg>`;
}
export {
  Apple as A,
  Google as G,
  Passkey_logo as P,
  Spinner as S,
  Apple_logo as a,
  Google_logo as b,
  enhance as e,
  getFormValue as g
};
