<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div>
  <h1 align="center">Passkeys, Social Login & more <br /> for Node.js apps</h1>
  <p align="center">
    Node SDK for Passkey authentication, Social Login using Apple, Google and more...
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{GITHUB_REPO}#">GitHub</a>
    ·    
    <a href="#{DEMO_SITE}#">Demo</a>
    ·
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Tutorial</a>
  </p>
</div>

<br />

## See also

For frontend usage please see the accompanying [@passlock/client][client] package

## Requirements

Node 16+

## Usage

Generate a secure token in your frontend then use this API to obtain the passkey registration or authentication details:

```typescript
import { Passlock } from '@passlock/node'

const passlock = new Passlock({ tenancyId, apiKey })

// token comes from your frontend
const principal = await passlock.fetchPrincipal({ token })

// get the user id
console.log(principal.user.id)
```

[contact]: https://passlock.dev/contact
[client]: https://www.npmjs.com/package/@passlock/client