# Contributing

How to build, test, and submit a change to `theme`.

## Contents

- [Development](#development)
- [Changing a token](#changing-a-token)
- [Commits and pull requests](#commits-and-pull-requests)
- [Developer Certificate of Origin](#developer-certificate-of-origin)
- [Reporting bugs](#reporting-bugs)

## Development

- Required tools: Node as declared in `package.json` `engines`, `just`, and
  Xcode with the Swift toolchain for the Swift package.
- Install dependencies once: `just install`. Install git hooks once per clone:
  `lefthook install`.
- Run the canonical local checks before opening a pull request: `just check`.
  It runs every gate and reports all failures together. `just --list` names
  each gate.
- Every pull request is gated by these workflows; a change lands only when all
  of them pass:
  - `ci.yml` runs the web gates, the Swift gates, a consumer app build with
    the extension build flags, an npm audit, the workflow lint, the REUSE
    check, the gitleaks scan, the zizmor audit, and the DCO check. The last four
    call reusable workflows from `openbunny/.github`. The DCO check requires a
    `Signed-off-by` trailer on every commit.
- `tokens/*.json` is the only authored source for values. Do not edit a
  generated file; change the token or the generator and run `just generate`.
  The generated files are `packages/web/css/{tokens,tailwind,extension-aliases}.css`,
  `packages/web/src/tokens.ts`, `packages/web/dist/`, `packages/web/fonts/*.woff2`,
  `Sources/OpenBunnyTheme/Generated/`, and `xcode/AccentColor.colorset/`.

## Changing a token

- A token value change is a minor release. A token rename or removal is a major
  release, because consumers reference tokens by name.
- Every color token appears in `tests/contrast-pairs.json`. A new color without
  a pair fails `just test`. A pair below its minimum fails `just contrast`.
  Decide whether the token or the pair set is wrong and say which in the pull
  request; do not lower a minimum to pass.
- Every scale token in `tokens/dimension.json` carries a `$description` that
  matches `Role: <usage>.` and names the role (surface, text, fill, cursor,
  spacing, line length) without a file path. A token without a role does not
  belong in the scale.
- SwiftUI takes native macOS point sizes from `tokens/native.json`, not
  conversions of the rem scale.

## Commits and pull requests

- One logical change per commit. Use Conventional Commits headers: `feat:`,
  `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- The pull request states what changed and why, and links related issues.
- Do not weaken a lint rule, delete a failing test, lower a contrast minimum, or
  widen a suppression to make CI pass. Fix the cause, or say why the gate is
  wrong.

## Developer Certificate of Origin

Every commit must carry a `Signed-off-by` trailer, certifying you wrote it or
otherwise have the right to submit it under the
[Developer Certificate of Origin](https://developercertificate.org/). Add it
with `git commit --signoff` (or `-s`). This project does not use a Contributor
License Agreement; the DCO is the only requirement.

## Reporting bugs

Open an issue with the package and version, the consuming project, the observed
output, and the expected output. For a security report, follow
[SECURITY.md](SECURITY.md) instead.
