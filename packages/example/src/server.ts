//e.g server.js

import {
  deletePasskey,
  exchangeCode,
  isDeletedPasskey,
  isExtendedPrincipal,
  isPasskey,
  isPrincipal,
  updatePasskey,
  verifyIdToken,
} from "@passlock/node"
import bodyParser from "body-parser"
import express from "express"
import ViteExpress from "vite-express"

const app = express()
app.use(bodyParser.json())

interface PasslockOptions {
  tenancyId: string
  apiKey: string
  endpoint: string
}

app.post("/principal", async (req, res) => {
  const { code, tenancyId, apiKey, endpoint } = req.body as PasslockOptions & {
    code: string
  }
  const result = await exchangeCode({ code, tenancyId, apiKey, endpoint })
  if (isExtendedPrincipal(result)) {
    res.send(JSON.stringify(result))
  } else {
    res.status(400)
    res.send(JSON.stringify(result.message))
  }
})

app.post("/id_token", async (req, res) => {
  const {
    id_token: token,
    tenancyId,
    endpoint,
  } = req.body as PasslockOptions & { id_token: string }
  const principal = await verifyIdToken({ token, tenancyId, endpoint })
  if (isPrincipal(principal)) {
    res.send(JSON.stringify(principal))
  } else {
    res.status(400)
    res.send(JSON.stringify(principal.message))
  }
})

app.delete("/passkey/:passkeyId", async (req, res) => {
  const passkeyId = req.params.passkeyId
  const { tenancyId, endpoint, apiKey } = req.body as PasslockOptions

  const deletedPasskey = await deletePasskey({
    passkeyId,
    tenancyId,
    endpoint,
    apiKey,
  })

  if (isDeletedPasskey(deletedPasskey)) {
    res.send(JSON.stringify(deletedPasskey))
  } else {
    res.status(400)
    res.send(JSON.stringify(deletedPasskey.message))
  }
})

app.patch("/passkey/:passkeyId", async (req, res) => {
  const passkeyId = req.params.passkeyId
  const { tenancyId, endpoint, apiKey, username } =
    req.body as PasslockOptions & { username: string }

  const updatedPasskey = await updatePasskey({
    tenancyId,
    endpoint,
    apiKey,
    passkeyId,
    username,
  })

  if (isPasskey(updatedPasskey)) {
    res.send(JSON.stringify(updatedPasskey))
  } else {
    res.status(400)
    res.send(JSON.stringify(updatedPasskey.message))
  }
})

ViteExpress.listen(app, 5174, () => {
  console.log("Server is listening...")
  console.log("http://localhost:5174")
})
