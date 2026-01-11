//e.g server.js

import {
  deletePasskey,
  exchangeCode,
  isDeletedPasskey,
  isExtendedPrincipal,
  isPrincipal,
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
  const { code, tenancyId, apiKey, endpoint } = req.body as PasslockOptions & { code: string }
  const principal = await exchangeCode(code, { tenancyId, apiKey, endpoint })
  if (isExtendedPrincipal(principal)) {
    res.send(JSON.stringify(principal))
  } else {
    res.status(400)
    res.send(JSON.stringify(principal.message))
  }
})

app.post("/id_token", async (req, res) => {
  const { id_token, tenancyId, endpoint } = req.body as PasslockOptions & { id_token: string }
  const principal = await verifyIdToken(id_token, { tenancyId, endpoint })
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

  const deletedPasskey = await deletePasskey(passkeyId, { tenancyId, endpoint, apiKey })

  if (isDeletedPasskey(deletedPasskey)) {
    res.send(JSON.stringify(deletedPasskey))
  } else {
    res.status(400)
    res.send(JSON.stringify(deletedPasskey.message))
  }
})

ViteExpress.listen(app, 5174, () => console.log("Server is listening..."))
