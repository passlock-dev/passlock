import "./style.css";

import { authenticatePasskey, registerPasskey } from '@passlock2/client/passkey';
import { exchangeCode, verifyIdToken } from "@passlock2/server/principal"

const getBtn = (id: string) => document.querySelector<HTMLButtonElement>(id)!;

const getDiv = (id: string) => document.querySelector<HTMLDivElement>(id)!;

const getTextField = (id: string) => document.querySelector<HTMLInputElement>(id)!;

const tenancyIdField = getTextField("#tenancyId");

const registerBtn = getBtn("#register");

const authenticateBtn = getBtn("#authenticate");

const responseDiv = getDiv("#response");

const jwtDiv = getDiv("#jwt");

const copyJwt = getBtn("#copyJwt");

const verifyJwt = getBtn("#verifyJwt");

const jwtStatus = getBtn("#jwtStatus");

const jwtVerificationDiv = getDiv("#jwtVerification")

const codeDiv = getDiv("#code");

const errorDiv = getDiv("#error")

const copyCode = getBtn("#copyCode");

const verifyCode = getBtn("#verifyCode");

const codeStatus = getBtn("#codeStatus");

const codeVerificationDiv = getDiv("#codeVerification")

const userName = "jdoe@gmail.com";
const endpoint = "http://localhost:3000";

const resetUI = () => {
  responseDiv.hidden = true;
  errorDiv.hidden = true;
  jwtDiv.innerText = '';
  codeDiv.innerText = '';
  codeVerificationDiv.innerText = '';
  errorDiv.innerText = "";
}

registerBtn.addEventListener("click", async () => {
  resetUI();

  if (tenancyIdField === null || tenancyIdField.value.length < 5) {
    alert("TenancyID required")
    return;
  }

  try {
    const tenancyId = tenancyIdField.value;
    const data = await registerPasskey({ tenancyId, userName, endpoint })

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

  if (tenancyIdField === null || tenancyIdField.value.length < 5) {
    alert("TenancyID required")
    return;
  }

  try {
    const tenancyId = tenancyIdField.value;
    const data = await authenticatePasskey({ tenancyId, userName, endpoint })

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

  const jwt = jwtDiv.innerText.trim()
  const tenancyId = tenancyIdField.value.trim()
  
  try {
    const response = await verifyIdToken({ tenancyId, id_token: jwt, endpoint })
    jwtVerificationDiv.innerText = JSON.stringify(response, null, 2);
  } catch (err) {
    errorDiv.innerText = String(err);
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

  const code = codeDiv.innerText.trim()
  const tenancyId = tenancyIdField.value.trim()
  
  try {
    const response = await exchangeCode({ tenancyId, code, endpoint })
    codeVerificationDiv.innerText = JSON.stringify(response, null, 2);
  } catch (err) {
    errorDiv.innerText = String(err);
    errorDiv.hidden = false;
  }
});