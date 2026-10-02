# theme

> **Work in progress.** No release exists yet. Names, identifiers and
> interfaces can change without notice.

OpenBunny design tokens as one authored source with three generated outputs:
CSS custom properties, typed TypeScript constants, and a Swift package with
SwiftUI components. One repository and one release tag version all of them, so
the web and Swift outputs cannot disagree about a value.

Websites, scrollmark and glyphmark consume this repository and keep no theme
value of their own.

## Contents

- [Packages](#packages)
- [Tokens](#tokens)
- [Use from the web](#use-from-the-web)
- [Use from SwiftUI](#use-from-swiftui)
- [Consumers](#consumers)
- [Color roles and contrast](#color-roles-and-contrast)
- [Fonts](#fonts)
- [Gates](#gates)
- [Publishing](#publishing)
- [License](#license)

## Packages

| Name                         | Kind    | Contents                                                          |
| ---------------------------- | ------- | ----------------------------------------------------------------- |
| `@openbunny/theme`           | npm     | `css/`, `dist/` (typed tokens, contrast helper), `fonts/` (WOFF2) |
| `OpenBunnyTheme`             | SwiftPM | `Color` constants, metrics, font registration, TrueType fonts     |
| `OpenBunnyUI`                | SwiftPM | `.openbunnyTheme()`, `FlatButtonStyle`, `StatusText`, fonts       |
| `xcode/AccentColor.colorset` | file    | Accent color for an asset catalog, copied by the consumer         |

## Tokens

`tokens/*.json` is the only authored source. The files follow the
[Design Tokens Community Group format](https://www.designtokens.org/), with no
composite types. Style Dictionary reads them and `just generate` writes every
output; generated files are committed so a consumer needs no JavaScript
toolchain.

| File             | Holds                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| `color.json`     | Palette, aliases, and `color-scheme`                                           |
| `font.json`      | Font stacks and weights                                                        |
| `dimension.json` | Radius, border, focus, measure, popup width, page padding, type scale, spacing |
| `duration.json`  | Cursor blink timing                                                            |
| `native.json`    | SwiftUI point sizes, spacing, and window width; not derived from the rem scale |
| `extension.json` | Variable names that browser-extension pages expect                             |

Print overrides are not tokens. A consumer keeps its own `@media print` rules.

## Use from the web

```css
@import 'tailwindcss';
@import '@openbunny/theme/css/tokens.css';
@import '@openbunny/theme/css/tailwind.css';
```

- `tokens.css` defines every token as a custom property on `:root`.
- `tailwind.css` is an `@theme inline` block that maps the color, font and
  radius tokens onto Tailwind utilities.
- `extension-aliases.css` defines `--card`, `--primary`, `--primary-foreground`,
  `--muted-foreground`, `--input`, `--destructive` and `--radius` from tokens,
  for pages written against that variable set.
- `extension-base.css` styles `.link`, `.chip`, `::selection`, `:focus-visible`
  and reduced motion with no Tailwind dependency.
- `fonts.css` declares the `@font-face` rules for the bundled WOFF2 files.

```ts
import { color, font } from '@openbunny/theme/tokens';
import { contrastRatio } from '@openbunny/theme/contrast';
```

## Use from SwiftUI

```swift
import OpenBunnyTheme
import OpenBunnyUI
import SwiftUI

@main
struct ExampleApp: App {
    init() {
        do { try Fonts.register() } catch { fatalError(error.localizedDescription) }
    }

    var body: some Scene {
        WindowGroup {
            Text("Example").font(.themeTitle).openbunnyTheme()
        }
    }
}
```

`Fonts.register()` throws a `FontError` when a font file is missing from the
bundle, registration fails, or a family is unavailable afterwards. A caller that
ignores the error gets the system font silently, so handle it.

`.openbunnyTheme()` applies the theme font, foreground, tint and background, and
pins the color scheme to the `color-scheme` token. `.buttonStyle(.flat)` draws a
square button with a 1-point border. `StatusText` colors text with `valid` for
`.enabled` and `expired` for `.disabled` and `.unavailable`. `expired` text must sit on `paper`, `paper-inset` or `background`.

`xcode/AccentColor.colorset` holds the accent color, generated from the `sprout`
token. An asset catalog cannot import Swift constants, so copy the directory into
the app's catalog and keep `ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME` set
to `AccentColor`. `just accent` prints the file.

The package compiles under Swift 6 language mode with complete strict
concurrency, strict memory safety, and warnings as errors. `just consumer-build`
builds an app that links both products with those flags.

## Consumers

Until the owner approves a release, consumers pin a Git commit.

| Consumer | Dependency                                                                          |
| -------- | ----------------------------------------------------------------------------------- |
| Swift    | `.package(url: "https://github.com/openbunny/theme.git", revision: "<commit-sha>")` |
| npm      | `"@openbunny/theme": "github:openbunny/theme#<commit-sha>"`                         |

The root package exports the generated web files from `packages/web` for Git
installs. The release workflow publishes `packages/web` to npm.

### Websites

1. Add the npm dependency.
2. Run `just parity <path to the site's global stylesheet>` in this repository.
   It fails when any `:root` value, or any `@theme inline` line, differs from
   the generated CSS.
3. Replace the `@theme inline` block and the light-theme `:root` block in the
   stylesheet with the imports shown above, placed after
   `@import "tailwindcss"`.
4. Replace hard-coded `#FFFAEB` and `#2A2217` constants with `color.paper` and
   `color.ink` from `@openbunny/theme/tokens`. Hex case differs from the CSS and
   the value is the same.
5. Keep the component classes (link, chip, plate, cursor, syntax-token rules)
   and the print and reduced-motion blocks in the site; they are components.

Utility names such as `text-muted`, `bg-paper-deep` and `border-line` do not
change; `just test` compiles `tailwind.css` with Tailwind and asserts the
utilities are generated. The site still holds `paper`, `ink` and the bunny
palette inside its icon art. Those are art assets, not theme tokens, and stay
in the site.

### scrollmark and glyphmark

- Swift: link `OpenBunnyTheme` and `OpenBunnyUI` to the app target only, call
  `Fonts.register()` at launch, apply `.openbunnyTheme()`, and use the
  `AccentColor.colorset` from this repository.
- Extension pages: copy `css/tokens.css`, `css/extension-aliases.css`,
  `css/extension-base.css`, `css/fonts.css` and the `fonts/` files into the
  built resources, and link them from the page. The default extension CSP
  `default-src 'self'` covers the bundled fonts.
- Content scripts: import `color` and `font` from `@openbunny/theme/tokens`. A
  content script runs on a page whose fonts the theme does not control; the font
  stack falls back to the generic `monospace` family there. Do not add the
  fonts to `web_accessible_resources`.

## Color roles and contrast

`tests/contrast-pairs.json` is the authoritative list of allowed pairs. A color
token that appears in no allowed pair fails `just test`. The ratios follow
[WCAG 2.1](https://www.w3.org/TR/WCAG21/#contrast-minimum).

| Role                                        | Tokens                                                                 | Minimum    |
| ------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| Text                                        | `foreground`, `ink-deep`, `ink`, `ink-mid`, `muted`, `sprout`, `valid` | 4.5:1      |
| Text on a restricted ground                 | `expired`, on `paper`, `paper-inset` and `background` only             | 4.5:1      |
| Border, outline, cursor, non-text indicator | `ink-soft`, `line`, `border`, `ring`                                   | 3:1        |
| Ground for text                             | `paper`, `paper-inset`, `paper-deep`, `background`                     | n/a        |
| Selection ground                            | `sprout-fill`, with `ink-deep` text only                               | 4.5:1      |
| Surface or graphic fill                     | `expired`, with `paper` text on it, or on `sprout-fill`                | 4.5:1, 3:1 |

`ink-soft`, `line` and `border` must not carry text.

`expired` is not in the body-text set because `expired` on `paper-deep` is
4.43:1, below 4.5:1. On `paper` it is 4.62:1 and on `paper-inset` 4.54:1. The
pair `expired` on `paper-deep` is listed under `disallowed` in
`tests/contrast-pairs.json`. The pair set is the only thing that permits
`expired` text: expired text on `paper-deep` fails WCAG, and no pair allows it.

### Allowed pairs

Each row allows the foreground on each listed ground at the stated minimum.
`just test` fails when this table and `tests/contrast-pairs.json` list
different pairs or minimums.

| Foreground                     | Grounds                                                                                                         | Minimum |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------- |
| `color.foreground`             | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`, `extension.input`, `extension.card` | 4.5:1   |
| `color.ink-deep`               | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`, `color.sprout-fill`                 | 4.5:1   |
| `color.ink`                    | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 4.5:1   |
| `color.ink-mid`                | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 4.5:1   |
| `color.muted`                  | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 4.5:1   |
| `color.sprout`                 | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 4.5:1   |
| `color.valid`                  | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 4.5:1   |
| `color.expired`                | `color.paper`, `color.paper-inset`, `color.background`                                                          | 4.5:1   |
| `color.paper`                  | `color.expired`                                                                                                 | 4.5:1   |
| `extension.primary-foreground` | `extension.primary`                                                                                             | 4.5:1   |
| `extension.muted-foreground`   | `extension.card`                                                                                                | 4.5:1   |
| `extension.destructive`        | `extension.card`                                                                                                | 4.5:1   |
| `color.ink-soft`               | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 3:1     |
| `color.line`                   | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 3:1     |
| `color.border`                 | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 3:1     |
| `color.ring`                   | `color.paper`, `color.paper-inset`, `color.paper-deep`, `color.background`                                      | 3:1     |
| `color.expired`                | `color.sprout-fill`                                                                                             | 3:1     |

### Gate

- `just contrast` prints every allowed pair with its ratio and exits non-zero
  when any pair is below its minimum, or when no pair was evaluated. A failing
  pair is a decision about the token or the pair set; lowering a minimum is not
  an option.
- `just test` fails when a `disallowed` pair meets its minimum. A token change
  that makes `expired` on `paper-deep` reach 4.5:1 therefore requires moving
  the pair into the allowed set and the table above.
- The `evidence` field in `tests/contrast-pairs.json` records where each
  token is used, by role, in the source website and the measured ratios for
  `expired`. `just test`
  fails when a ratio stated there differs from the computed value to two
  decimals.

## Fonts

Courier Prime and JetBrains Mono are licensed under the SIL Open Font License
1.1. Each directory that holds font files also holds the license text.

- The Swift package bundles TrueType files, because CoreText cannot register
  WOFF2. `just fonts` downloads them from the upstream sources and verifies
  SHA-256 pins; no package manager distributes these files with a checksum.
- The npm package bundles the Latin 400 and 700 WOFF2 files that Fontsource
  builds from the same fonts. `just generate` copies them from the pinned
  `@fontsource` devDependencies.
- Website artwork is not part of this repository.

## Gates

`just check` runs each gate and reports all failures. Gates are `fonts-verify`,
`generate-check`, `test`, `contrast`, `format-check`, `lint`, `reuse`,
`swift-build`, `swift-test`, `consumer-build` and `footprint`; `just --list`
names every recipe.

- `generate-check` regenerates every output in a scratch copy and fails on any
  difference from the committed files.
- The generator fails on an empty token set, an alias that does not resolve, a
  glob that matches no file, a missing `color-scheme`, and a color that is not a
  six-digit lowercase hex.
- Tests compile the generated `tailwind.css` with Tailwind and compare every
  `:root` value to a committed token baseline.
  `just parity <path>` repeats the comparison against a live file.
- Swift tests compare every `Color` to the hex in `tokens/color.json`, and fail
  when a bundled font file is missing or a family is unavailable after
  registration.

## Publishing

The owner controls package releases:

1. Create the `@openbunny` npm scope and a GitHub environment named `npm`.
   Publish the first package version manually, then configure [npm Trusted
   Publishing](https://docs.npmjs.com/trusted-publishers/) for `openbunny/theme`,
   `release.yml`, and environment `npm`. The package must exist before the
   trusted publisher can be configured.
2. Merge a later release-please pull request. Its `vX.Y.Z` tag is the SwiftPM
   version; the release workflow publishes `@openbunny/theme` with the same
   number through npm's OIDC authentication and provenance.
3. In each consumer, replace the local-path dependency with the published one:
   `.package(url: "https://github.com/openbunny/theme.git", exact: "X.Y.Z")` for
   Swift and an exact `"@openbunny/theme": "X.Y.Z"` for npm.

## License

MIT, copyright OpenBunny. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
Third-party fonts keep their own license.
