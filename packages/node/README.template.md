<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div align="center">
  <picture align="center">
    <source srcset="#{ASSETS_CDN}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS_CDN}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Backend NodeJS library to accompany the <a href="https://www.npmjs.com/package/@passlock/client">@passlock/client</a> package
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{GITHUB_REPO}#">GitHub</a>
    ·
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Quick start</a>
  </p>
</div>

<br />

## See also

For frontend usage please see the accompanying [@passlock/client][client] package

## Requirements

Node 22+

## Usage

Generate a secure token in your frontend then use this API to obtain the passkey registration or authentication details:

```typescript
// unsafe just means the function could throw
import { exchangeCodeUnsafe } from "@passlock/node/principal";

// get these from your development tenancy settings
const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

const result = await exchangeCodeUnsafe(code, { tenancyId, apiKey });

// includes the passkey id and details about the authentication
console.log(result);
```

[contact]: https://passlock.dev/contact
[client]: https://www.npmjs.com/package/@passlock/client