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
    <source srcset="#{ASSETS}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    CLI wrapper around the Passlock API
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{GITHUB_REPO}#">GitHub</a>
    ·
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Quick start</a>
    ·
    <a href="#{DEMO}#">Demo</a>   
  </p>
</div>

<br />

## Requirements

Node 22+

## Usage

Install the CLI globally:

`npm install -g @passlock/cli`

or

`pnpm add -g @passlock/api`

### Create a cloud instance

`passlock init`

Follow the prompts

### Help

`passlock --help`