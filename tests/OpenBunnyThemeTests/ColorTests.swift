import AppKit
import Foundation
import SwiftUI
import Testing

@testable import OpenBunnyTheme

@Suite struct ColorTests {
    private func bytes(_ color: Color) throws -> [Int] {
        let srgb = try #require(NSColor(color).usingColorSpace(.sRGB))
        return [srgb.redComponent, srgb.greenComponent, srgb.blueComponent].map {
            Int(($0 * 255).rounded())
        }
    }

    private func bytes(hex: String) throws -> [Int] {
        let digits = try #require(hex.hasPrefix("#") ? String(hex.dropFirst()) : nil)
        let value = try #require(Int(digits, radix: 16))
        return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
    }

    @Test func paletteIsNotEmpty() {
        #expect(!Palette.all.isEmpty)
    }

    @Test func paletteCoversEveryColorToken() throws {
        let file = try TokenFile("color")
        let names = try file.group("color").keys.filter { !$0.hasPrefix("$") }
        #expect(Set(Palette.all.keys) == Set(names))
    }

    @Test func everyColorEqualsItsTokenHex() throws {
        let file = try TokenFile("color")
        for (name, color) in Palette.all {
            let hex = try #require(file.resolved("color", name) as? String)
            #expect(try bytes(color) == bytes(hex: hex), "\(name)")
        }
    }

    @Test func schemeEqualsToken() throws {
        let value = try #require(TokenFile("color").values["color-scheme"] as? [String: Any])
        #expect(value["$value"] as? String == "light")
        #expect(Scheme.colorScheme == .light)
    }
}
