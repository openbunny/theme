# Label taxonomy

Three prefixes: `type/*` classifies an issue, `area/*` locates it, `status/*`
tracks it through triage. Every issue and PR carries exactly one `type/*`
label; `area/*` and `status/*` are added during triage.

## Contents

- [type/\*](#type)
- [area/\*](#area)
- [status/\*](#status)

## type/\*

| Label           | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| `type/bug`      | A generated output differs from its token or breaks a build. |
| `type/feature`  | A new token, component, or output.                           |
| `type/docs`     | README, CONTRIBUTING, or other documentation only.           |
| `type/chore`    | Build, dependency, or repository maintenance.                |
| `type/security` | A vulnerability report or hardening change.                  |

## area/\*

| Label            | Covers                                                      |
| ---------------- | ----------------------------------------------------------- |
| `area/tokens`    | `tokens/*.json` and the contrast pair set                   |
| `area/web`       | `packages/web`: CSS, TypeScript constants, WOFF2 fonts      |
| `area/swift`     | `Sources/`: `OpenBunnyTheme`, `OpenBunnyUI`, TrueType fonts |
| `area/generator` | `style-dictionary.config.mjs` and `formats/`                |
| `area/ci`        | GitHub Actions workflows and release configuration          |
| `area/docs`      | README, CONTRIBUTING, and other tracked docs                |

## status/\*

| Label                 | Meaning                                                         |
| --------------------- | --------------------------------------------------------------- |
| `status/needs-triage` | Default label on a new issue; a maintainer has not reviewed it. |
| `status/confirmed`    | A maintainer reproduced the bug or accepted the proposal.       |
| `status/blocked`      | Waiting on an external dependency or a decision.                |
| `status/wontfix`      | Closed without a change; the issue states why.                  |
