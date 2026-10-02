set shell := ["bash", "-uc"]

export PATH := justfile_directory() / "node_modules/.bin" + ":" + env("PATH")

courier_prime_commit := "7fd585a2dd4c1612c79b3308e300923d1c13df93"
jetbrains_mono_version := "2.304"
jetbrains_mono_zip_sha256 := "6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf"
resources := "Sources/OpenBunnyTheme/Resources"

default:
    just --list

install:
    npm ci

generate:
    #!/usr/bin/env bash
    set -euo pipefail
    style-dictionary build --config style-dictionary.config.mjs
    for family in courier-prime jetbrains-mono; do
        for weight in 400 700; do
            cp "node_modules/@fontsource/$family/files/$family-latin-$weight-normal.woff2" packages/web/fonts/
        done
    done
    prettier --write packages/web/css/tokens.css packages/web/css/tailwind.css \
        packages/web/css/extension-aliases.css packages/web/src/tokens.ts \
        xcode/AccentColor.colorset/Contents.json
    swift format -i Sources/OpenBunnyTheme/Generated/Tokens.swift
    tsc -p packages/web

generate-check:
    #!/usr/bin/env bash
    set -euo pipefail
    scratch=.check
    rm -rf "$scratch"
    mkdir "$scratch"
    trap 'rm -rf "$scratch"' EXIT
    rsync -a --exclude .git --exclude node_modules --exclude .build --exclude "$scratch" ./ "$scratch/"
    ln -s "$PWD/node_modules" "$scratch/node_modules"
    (cd "$scratch" && just generate)
    status=0
    for path in packages/web/css packages/web/src packages/web/dist packages/web/fonts \
        Sources/OpenBunnyTheme/Generated xcode; do
        if [ -z "$(ls -A "$path")" ]; then
            echo "generate-check: $path is empty" >&2
            status=1
        fi
        diff -r "$path" "$scratch/$path" || status=1
    done
    exit $status

fonts:
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    courier=https://raw.githubusercontent.com/quoteunquoteapps/CourierPrime/{{ courier_prime_commit }}
    for name in Regular Bold; do
        curl -fsSL "$courier/fonts/ttf/CourierPrime-$name.ttf" -o "{{ resources }}/CourierPrime-$name.ttf"
    done
    curl -fsSL "$courier/OFL.txt" -o "{{ resources }}/OFL-CourierPrime.txt"
    curl -fsSL "https://github.com/JetBrains/JetBrainsMono/releases/download/v{{ jetbrains_mono_version }}/JetBrainsMono-{{ jetbrains_mono_version }}.zip" -o "$tmp/jb.zip"
    echo "{{ jetbrains_mono_zip_sha256 }}  $tmp/jb.zip" | shasum -a 256 -c -
    unzip -q "$tmp/jb.zip" -d "$tmp/jb"
    for name in Regular Bold; do
        cp "$tmp/jb/fonts/ttf/JetBrainsMono-$name.ttf" "{{ resources }}/"
    done
    cp "$tmp/jb/OFL.txt" "{{ resources }}/OFL-JetBrainsMono.txt"
    cp {{ resources }}/OFL-*.txt packages/web/fonts/
    just fonts-verify

fonts-verify:
    shasum -a 256 -c fonts.sha256

test:
    node --test tests/*.test.ts

contrast:
    node tests/contrast-report.ts

typecheck:
    tsc -p packages/web --noEmit
    tsc -p tests --noEmit

format:
    prettier --write .
    swift format -i -r Sources tests Package.swift

format-check:
    prettier --check .

swift-format-lint:
    swift format lint --strict -r Sources tests Package.swift

knip:
    knip

actions-lint:
    actionlint

zizmor:
    zizmor --persona=pedantic .github/workflows

pinact-check:
    #!/usr/bin/env bash
    set -euo pipefail
    shopt -s nullglob
    files=(.github/workflows/*.yml .github/workflows/*.yaml)
    if [ "${#files[@]}" -eq 0 ]; then
        echo "pinact-check: no workflow files found in .github/workflows" >&2
        exit 1
    fi
    pinact run --check --verify-comment "${files[@]}"

reuse:
    uvx reuse lint

ci-web: install fonts-verify test contrast format-check knip typecheck

ci-swift: install generate-check swift-format-lint swift-build swift-test consumer-build footprint

ci-audit: install
    npm audit signatures
    npm audit --audit-level=high

lint: swift-format-lint knip typecheck actions-lint zizmor

swift-build:
    swift build

swift-test:
    swift test

consumer-build:
    #!/usr/bin/env bash
    set -euo pipefail
    work=$(mktemp -d)
    trap 'rm -rf "$work" tests/consumer/Consumer.xcodeproj' EXIT
    (cd tests/consumer && xcodegen generate --quiet)
    xcodebuild -quiet -project tests/consumer/Consumer.xcodeproj -scheme Consumer \
        -destination 'platform=macOS' -derivedDataPath "$work/derived" build

footprint:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -z "$(find Sources -name '*.swift')" ]; then
        echo "footprint: no Swift sources under Sources" >&2
        exit 1
    fi
    status=0
    grep -rEn 'UserDefaults|URLSession|NSURLConnection|import Network|NWConnection' Sources && status=1
    find . -path ./node_modules -prune -o \( -name '*.entitlements' -o -name 'PrivacyInfo.xcprivacy' \) -print | grep . && status=1
    exit $status

accent:
    @cat xcode/AccentColor.colorset/Contents.json

parity globals:
    SITE_GLOBALS={{ globals }} node --test tests/parity.test.ts

selftest:
    #!/usr/bin/env bash
    set -uo pipefail
    scratch=$(mktemp -d)
    trap 'rm -rf "$scratch"' EXIT
    status=0
    plant() {
        local gate=$1 fault=$2
        rm -rf "$scratch/repo"
        mkdir "$scratch/repo"
        rsync -a --exclude .git --exclude node_modules --exclude .build --exclude .check ./ "$scratch/repo/"
        ln -s "$PWD/node_modules" "$scratch/repo/node_modules"
        (cd "$scratch/repo" && eval "$fault")
        if (cd "$scratch/repo" && just "$gate" >/dev/null 2>&1); then
            echo "selftest: $gate passed with a planted fault: $fault" >&2
            status=1
        else
            echo "selftest: $gate failed on its planted fault: $fault"
        fi
    }
    plant generate-check "echo '/* edited */' >> packages/web/css/tokens.css"
    plant generate-check "rm Sources/OpenBunnyTheme/Generated/Tokens.swift"
    plant fonts-verify "printf x >> Sources/OpenBunnyTheme/Resources/CourierPrime-Bold.ttf"
    plant footprint "echo 'import Foundation; let d = UserDefaults.standard' > Sources/OpenBunnyTheme/Leak.swift"
    plant knip "echo 'export const unused = 1;' > packages/web/src/unused.ts"
    plant test "sed -i '' 's/#fffaeb/#fffbeb/' tokens/color.json"
    plant swift-test "sed -i '' 's/#fffaeb/#fffbeb/' tokens/color.json"
    plant test "rm packages/web/fonts/courier-prime-latin-400-normal.woff2"
    exit $status

check:
    #!/usr/bin/env bash
    set -uo pipefail
    failed=()
    for gate in fonts-verify generate-check test contrast format-check lint reuse swift-build swift-test consumer-build footprint; do
        echo "== $gate"
        just "$gate" || failed+=("$gate")
    done
    if [ "${#failed[@]}" -gt 0 ]; then
        echo "failed gates: ${failed[*]}" >&2
        exit 1
    fi
