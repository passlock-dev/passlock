import "./style.css"

import {
  authenticatePasskey,
  type CredentialMapping,
  deletePasskey,
  isAuthenticationSuccess,
  isRegistrationSuccess,
  LogEvent,
  LogLevel,
  registerPasskey,
  updateUserDetails,
} from "@passlock/client"

const BASE_URL = "http://localhost:5174"

const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
}

let savedPasskeyId: string | null = null

/* Lookup HTML elements */

const getBtn = (id: string) => document.querySelector<HTMLButtonElement>(id)!

const getDiv = (id: string) => document.querySelector<HTMLDivElement>(id)!

const getTextField = (id: string) => document.querySelector<HTMLInputElement>(id)!

const getDialog = (id: string) => document.querySelector<HTMLDialogElement>(id)!

/* HTML elements */

const tenancyIdField = getTextField("#tenancyId")

const apiKeyField = getTextField("#apiKey")

const usernameField = getTextField("#username")

const displayNameField = getTextField("#displayName")

const registerBtn = getBtn("#register")

const authenticateBtn = getBtn("#authenticate")

const renameBtn = getBtn("#rename")

const deleteBtn = getBtn("#deletePasskey")

const responseDiv = getDiv("#response")

const jwtDiv = getDiv("#jwt")

const copyJwt = getBtn("#copyJwt")

const verifyJwt = getBtn("#verifyJwt")

const jwtStatus = getBtn("#jwtStatus")

const jwtVerificationDiv = getDiv("#jwtVerification")

const codeDiv = getDiv("#code")

const errorDiv = getDiv("#error")

const copyCode = getBtn("#copyCode")

const verifyCode = getBtn("#verifyCode")

const codeStatus = getBtn("#codeStatus")

const codeVerificationDiv = getDiv("#codeVerification")

const endpointField = getTextField("#endpoint")

const passkeyDeletedModal = getDialog("#passkeyDeleted")

const resetUI = () => {
  responseDiv.hidden = true
  errorDiv.hidden = true
  jwtDiv.innerText = ""
  codeDiv.innerText = ""
  codeVerificationDiv.innerText = ""
  errorDiv.innerText = ""
  jwtVerificationDiv.innerText = ""
  codeVerificationDiv.innerText = ""
}

/**
 * Save the endpoint to local storage
 * @returns
 */
const saveEndpoint = () => {
  if (endpointField === null || endpointField.value.length < 5) {
    localStorage.setItem("endpoint", "http://localhost:3000")
    return "http://localhost:3000"
  } else {
    localStorage.setItem("tenancyId", tenancyIdField.value)
    return endpointField.value
  }
}

/**
 * Fetch the value from local storage and update the UI
 */
const restoreEndpoint = () => {
  const endpoint = localStorage.getItem("endpoint")

  if (endpoint) {
    endpointField.value = endpoint
  } else {
    endpointField.value = "http://localhost:3000"
  }
}

const saveTenancyId = () => {
  if (tenancyIdField === null || tenancyIdField.value.length < 5) {
    alert("TenancyID required")
    throw false
  }

  localStorage.setItem("tenancyId", tenancyIdField.value)

  return tenancyIdField.value
}

const restoreTenancyId = () => {
  const tenancyId = localStorage.getItem("tenancyId")

  if (tenancyId) {
    tenancyIdField.value = tenancyId
  }
}

const saveApiKey = () => {
  if (apiKeyField === null || apiKeyField.value.length < 5) {
    alert("API Key required")
    throw false
  }

  localStorage.setItem("apiKey", apiKeyField.value)

  return apiKeyField.value
}

const restoreApiKey = () => {
  const apiKey = localStorage.getItem("apiKey")

  if (apiKey) {
    apiKeyField.value = apiKey
  }
}

const saveUserName = () => {
  if (usernameField === null || usernameField.value.length < 5) {
    alert("Username required")
    throw false
  }

  localStorage.setItem("username", usernameField.value)

  return usernameField.value
}

const restoreUserName = () => {
  const username = localStorage.getItem("username")

  if (username) {
    usernameField.value = username
  }
}

const saveDisplayName = () => {
  if (displayNameField === null || displayNameField.value.length < 5) {
    return undefined
  }

  localStorage.setItem("displayName", displayNameField.value)

  return displayNameField.value
}

const restoreDisplayName = () => {
  const displayName = localStorage.getItem("displayName")

  if (displayName) {
    displayNameField.value = displayName
  }
}

/**
 * Needed so we can pass the userId during authentication calls,
 * although the user only presents the username.
 * @param username
 * @param passkeyId
 */
const saveUserMapping = (username: string, passkeyId: string) => {
  localStorage.setItem(`mappings:${username}`, passkeyId)
}

const getUserMappping = (username: string) => {
  return localStorage.getItem(`mappings:${username}`) ?? undefined
}

registerBtn.addEventListener("click", async () => {
  resetUI()

  const endpoint = saveEndpoint()
  const tenancyId = saveTenancyId()
  const username = saveUserName()
  const userDisplayName = saveDisplayName()
  const userVerification = "discouraged" as const
  const data = await registerPasskey({
    endpoint,
    tenancyId,
    userDisplayName,
    username,
    userVerification,
  })

  if (isRegistrationSuccess(data)) {
    savedPasskeyId = data.principal.authenticatorId
    saveUserMapping(username, data.principal.authenticatorId)
    jwtDiv.innerText = data.id_token
    codeDiv.innerText = data.code
  } else {
    errorDiv.innerText = data.message
    errorDiv.hidden = false
  }

  responseDiv.hidden = false
})

authenticateBtn.addEventListener("click", async () => {
  resetUI()

  const endpoint = saveEndpoint()
  const tenancyId = saveTenancyId()
  const username = usernameField.value.length > 5 ? usernameField.value : undefined
  const passkeyId = username ? getUserMappping(username) : undefined
  const data = await authenticatePasskey({
    allowCredentials: passkeyId ? [passkeyId] : undefined,
    endpoint,
    tenancyId,
    userVerification: "required",
  })

  if (isAuthenticationSuccess(data)) {
    savedPasskeyId = data.principal.authenticatorId
    jwtDiv.innerText = data.id_token
    codeDiv.innerText = data.code
  } else {
    errorDiv.innerText = data.message
    errorDiv.hidden = false
  }

  responseDiv.hidden = false
})

deleteBtn.addEventListener("click", async () => {
  resetUI()

  const apiKey = saveApiKey()
  const endpoint = saveEndpoint()
  const tenancyId = saveTenancyId()

  const username = usernameField.value.length > 5 ? usernameField.value : undefined
  const passkeyId = username ? getUserMappping(username) : undefined
  const data = await authenticatePasskey({
    allowCredentials: passkeyId ? [passkeyId] : undefined,
    endpoint,
    tenancyId,
    userVerification: "required",
  })

  if (isAuthenticationSuccess(data)) {
    const passkeyId = data.principal.authenticatorId

    const fetchResponse = await fetch(`${BASE_URL}/passkey/${passkeyId}`, {
      method: "DELETE",
      headers: HEADERS,
      body: JSON.stringify({ tenancyId, apiKey, endpoint }),
    })

    if (fetchResponse.ok) {
      const deletedPasskey = (await fetchResponse.json()) as CredentialMapping
      const deleteResult = await deletePasskey(deletedPasskey, { tenancyId, endpoint })
      if (typeof deleteResult === "boolean") {
        passkeyDeletedModal.showModal()
      } else {
        errorDiv.innerText = deleteResult.message
        errorDiv.hidden = false
      }
    } else {
      const error = await fetchResponse.json()
      errorDiv.innerText = error
      errorDiv.hidden = false
    }
  }
})

renameBtn.addEventListener("click", async () => {
  resetUI()

  const endpoint = saveEndpoint()
  const tenancyId = saveTenancyId()
  const username = usernameField.value
  const displayName = displayNameField.value

  if (savedPasskeyId) {
    await updateUserDetails(
      {
        tenancyId, 
        endpoint,
        passkeyId: savedPasskeyId,
        username,
        displayName,
      }
    )

    saveUserMapping(username, savedPasskeyId)
  } else {
    const data = await authenticatePasskey({
      endpoint,
      tenancyId,
      userVerification: "required",
    })

    if (isAuthenticationSuccess(data)) {
      const { authenticatorId: passkeyId } = data.principal
      await updateUserDetails({ 
        tenancyId, 
        endpoint, 
        passkeyId, 
        username, 
        displayName 
      })
      saveUserMapping(username, passkeyId)
    } else {
      errorDiv.innerText = data.message
      errorDiv.hidden = false
    }
  }

  responseDiv.hidden = false
})

copyJwt.addEventListener("click", () => {
  navigator.clipboard.writeText(jwtDiv.innerText)
  jwtStatus.innerText = "Copied"
  setTimeout(() => {
    jwtStatus.innerText = ""
  }, 1000)
})

verifyJwt.addEventListener("click", async () => {
  errorDiv.innerHTML = ""
  errorDiv.hidden = true
  jwtVerificationDiv.innerText = ""

  const id_token = jwtDiv.innerText.trim()
  const endpoint = saveEndpoint()
  const tenancyId = saveTenancyId()

  const response = await fetch(`${BASE_URL}/id_token`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ id_token, endpoint, tenancyId }),
  })

  if (response.ok) {
    const json = await response.json()
    jwtVerificationDiv.innerText = JSON.stringify(json, null, 2)
  } else {
    const json = await response.json()
    errorDiv.innerText = json
    errorDiv.hidden = false
  }
})

copyCode.addEventListener("click", () => {
  navigator.clipboard.writeText(codeDiv.innerText)
  codeStatus.innerText = "Copied"
  setTimeout(() => {
    codeStatus.innerText = ""
  }, 1000)
})

verifyCode.addEventListener("click", async () => {
  errorDiv.innerHTML = ""
  errorDiv.hidden = true
  codeVerificationDiv.innerText = ""

  const apiKey = saveApiKey()
  const code = codeDiv.innerText.trim()
  const endpoint = saveEndpoint()
  const tenancyId = saveTenancyId()

  const response = await fetch(`${BASE_URL}/principal`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ code, apiKey, endpoint, tenancyId }),
  })

  if (response.ok) {
    const json = await response.json()
    codeVerificationDiv.innerText = JSON.stringify(json, null, 2)
  } else {
    const json = await response.json()
    errorDiv.innerText = json
    errorDiv.hidden = false
  }
})

const restoreAll = () => {
  restoreEndpoint()
  restoreTenancyId()
  restoreUserName()
  restoreDisplayName()
  restoreApiKey()
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  restoreAll()
} else document.addEventListener("load", restoreAll)

window.addEventListener(LogEvent.name, ((event: LogEvent) => {
  if (event.level === LogLevel.INFO) console.log(event.message)
}) as EventListener)
