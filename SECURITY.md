# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities privately, not through a public issue. Where
GitHub private vulnerability reporting is enabled, use the repository's
**Security** tab and choose **Report a vulnerability**; otherwise contact an
organization administrator directly.

Include the affected package (`@openbunny/theme`, `OpenBunnyTheme` or
`OpenBunnyUI`), the impact, and steps to reproduce. A maintainer acknowledges
the report and coordinates a fix and disclosure.

## Scope

This policy covers the code, generated outputs and bundled fonts in this
repository. It does not cover the projects that consume the theme.

## Runtime behaviour

The packages make no network calls, read no environment variables and persist
nothing. `OpenBunnyTheme` and `OpenBunnyUI` add no entitlement, no
`UserDefaults` access and no privacy-manifest category to the app that links
them. `just footprint` fails when a source file references `UserDefaults` or a
network API, or when the repository contains an entitlements file or a privacy
manifest.

## Supply chain

- Font files are pinned by SHA-256 in `fonts.sha256`. `just fonts-verify` fails
  when a file differs from its pin, and `just fonts` fails when a download does
  not match.
- Generated outputs are committed. `just generate-check` regenerates them in a
  scratch copy and fails on any difference, so a published artifact matches
  the tokens and generator in the tagged commit.
- The npm package is published with provenance from the release workflow.
  Verify it with `npm audit signatures` in a consuming project.
- Workflow actions are pinned by commit SHA, and `just pinact-check` and
  `just zizmor` check the pins and the workflow permissions.
