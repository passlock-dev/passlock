import { LogEvent, LogLevel } from "@passlock/client/logger";
import "./style.css";

import { registerPasskeyUnsafe, authenticatePasskeyUnsafe } from '@passlock/client/passkey';
import { exchangeCode, verifyIdToken, isPrincipal } from "@passlock/node/principal";

const getBtn = (id: string) => document.querySelector<HTMLButtonElement>(id)!;

const getDiv = (id: string) => document.querySelector<HTMLDivElement>(id)!;

const getTextField = (id: string) => document.querySelector<HTMLInputElement>(id)!;

const tenancyIdField = getTextField("#tenancyId");

const apiKeyField = getTextField("#apiKey");

const usernameField = getTextField("#username");

const registerBtn = getBtn("#register");

const authenticateBtn = getBtn("#authenticate");

const responseDiv = getDiv("#response");

const jwtDiv = getDiv("#jwt");

const copyJwt = getBtn("#copyJwt");

const verifyJwt = getBtn("#verifyJwt");

const jwtStatus = getBtn("#jwtStatus");

const jwtVerificationDiv = getDiv("#jwtVerification");

const codeDiv = getDiv("#code");

const errorDiv = getDiv("#error");

const copyCode = getBtn("#copyCode");

const verifyCode = getBtn("#verifyCode");

const codeStatus = getBtn("#codeStatus");

const codeVerificationDiv = getDiv("#codeVerification");

// const endpoint = "http://localhost:3000";
const endpointField = getTextField("#endpoint");

const resetUI = () => {
  responseDiv.hidden = true;
  errorDiv.hidden = true;
  jwtDiv.innerText = '';
  codeDiv.innerText = '';
  codeVerificationDiv.innerText = '';
  errorDiv.innerText = "";
  jwtVerificationDiv.innerText = "";
  codeVerificationDiv.innerText = "";
}

const saveEndpoint = () => {
  if (endpointField === null || endpointField.value.length < 5) {
    localStorage.setItem("endpoint", "http://localhost:3000");
    return "http://localhost:3000";
  } else {
    localStorage.setItem("tenancyId", tenancyIdField.value);
    return endpointField.value;
  }
}

const restoreEndpoint = () => {
  const endpoint = localStorage.getItem("endpoint");

  if (endpoint) {
    endpointField.value = endpoint;
  } else {
    endpointField.value = "http://localhost:3000";
  }
}

const saveTenancyId = () => {
  if (tenancyIdField === null || tenancyIdField.value.length < 5) {
    alert("TenancyID required");
    throw false;
  }
  
  localStorage.setItem("tenancyId", tenancyIdField.value)
  
  return tenancyIdField.value;
}

const restoreTenancyId = () => {
  const tenancyId = localStorage.getItem("tenancyId");

  if (tenancyId) {
    tenancyIdField.value = tenancyId
  }
}

const saveApiKey = () => {
  if (apiKeyField === null || apiKeyField.value.length < 5) {
    alert("API Key required");
    throw false;
  }
  
  localStorage.setItem("apiKey", apiKeyField.value);
  
  return apiKeyField.value;
}

const restoreApiKey = () => {
  const apiKey = localStorage.getItem("apiKey");

  if (apiKey) {
    apiKeyField.value = apiKey;
  }
}

const saveUserName = () => {
  if (usernameField === null || usernameField.value.length < 5) {
    alert("Username required");
    throw false;
  }
  
  localStorage.setItem("username", usernameField.value);
  
  return usernameField.value;
}

const restoreUserName = () => {
  const username = localStorage.getItem("username");

  if (username) {
    usernameField.value = username;
  }
}

const saveUserMapping = (username: string, userId: string) => {
  localStorage.setItem(`mappings:${username}`, userId);
}

const getUserMappping = (username: string) => {
  return localStorage.getItem(`mappings:${username}`) ?? undefined;
}

registerBtn.addEventListener("click", async () => {
  resetUI();

  try {
    const endpoint = saveEndpoint();
    const tenancyId = saveTenancyId();
    const username = saveUserName();
    const userVerification = "discouraged" as const;
    const data = await registerPasskeyUnsafe({ username, userDisplayName: "Toby Hobson", userVerification, tenancyId, endpoint });

    saveUserMapping(username, data.principal.userId);

    jwtDiv.innerText = data.id_token;
    codeDiv.innerText = data.code;
    responseDiv.hidden = false;
  } catch (err) {
    errorDiv.innerText = String(err);
    errorDiv.hidden = false;
  }
});

authenticateBtn.addEventListener("click", async () => {
  resetUI();

  try {
    const endpoint = saveEndpoint();
    const tenancyId = saveTenancyId();
    const username = usernameField.value.length > 5 ? usernameField.value : undefined;
    const userId = username ? getUserMappping(username) : undefined;
    const data = await authenticatePasskeyUnsafe({ userId, tenancyId, endpoint, userVerification: 'required' });

    jwtDiv.innerText = data.id_token;
    codeDiv.innerText = data.code;
    responseDiv.hidden = false;
  } catch (err) {
    errorDiv.innerText = String(err);
    errorDiv.hidden = false;
  }
});

copyJwt.addEventListener("click", () => {
  navigator.clipboard.writeText(jwtDiv.innerText);
  jwtStatus.innerText = "Copied";
  setTimeout(() => {
    jwtStatus.innerText = '';
  }, 1000)
});

verifyJwt.addEventListener("click", async () => {
  errorDiv.innerHTML = '';
  errorDiv.hidden = true;
  jwtVerificationDiv.innerText = '';

  const jwt = jwtDiv.innerText.trim();
  const endpoint = saveEndpoint();
  const tenancyId = saveTenancyId();

  const result = await verifyIdToken(jwt, { tenancyId, endpoint });
  if (isPrincipal(result)) {
    jwtVerificationDiv.innerText = JSON.stringify(result, null, 2);
  } else {
    errorDiv.innerText = String(result.message);
    errorDiv.hidden = false;    
  }
});

copyCode.addEventListener("click", () => {
  navigator.clipboard.writeText(codeDiv.innerText);
  codeStatus.innerText = "Copied";
  setTimeout(() => {
    codeStatus.innerText = '';
  }, 1000)
});

verifyCode.addEventListener("click", async () => {
  errorDiv.innerHTML = '';
  errorDiv.hidden = true;
  codeVerificationDiv.innerText = '';

  const apiKey = saveApiKey();
  const code = codeDiv.innerText.trim();
  const endpoint = saveEndpoint();
  const tenancyId = saveTenancyId();

  const result = await exchangeCode(code, { tenancyId, apiKey, endpoint });
  if (isPrincipal(result)) {
     codeVerificationDiv.innerText = JSON.stringify(result, null, 2);
  } else {
    errorDiv.innerText = result.message;
    errorDiv.hidden = false;
  }
});

const restoreAll = () => {
  restoreEndpoint();
  restoreTenancyId();
  restoreUserName();
  restoreApiKey();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  restoreAll();
} else document.addEventListener('load', restoreAll);

window.addEventListener(LogEvent.name, ((event: LogEvent) => {
  if (event.level === LogLevel.INFO) console.log(event.message);
}) as EventListener);