import CoreText
import Foundation
import Testing

@testable import OpenBunnyTheme

@Suite struct FontTests {
    @Test func everyBundledFileExists() {
        #expect(!Fonts.files.isEmpty)
        for file in Fonts.files {
            #expect(
                Bundle.module.url(
                    forResource: file, withExtension: "ttf", subdirectory: "Resources")
                    != nil,
                "\(file)")
        }
    }

    @Test func licenseTextsAccompanyTheFonts() {
        for license in ["OFL-CourierPrime", "OFL-JetBrainsMono"] {
            #expect(
                Bundle.module.url(
                    forResource: license, withExtension: "txt", subdirectory: "Resources")
                    != nil,
                "\(license)")
        }
    }

    @Test func registrationSucceedsAndIsRepeatable() throws {
        try Fonts.register()
        try Fonts.register()
    }

    @Test func registeredFamiliesAreAvailable() throws {
        try Fonts.register()
        let available = try #require(CTFontManagerCopyAvailableFontFamilyNames() as? [String])
        for family in Fonts.families {
            #expect(available.contains(family), "\(family)")
        }
    }

    @Test func familyTokensEqualFontFile() throws {
        let fonts = try TokenFile("font").group("font")
        for (key, family) in [("display", FontFamily.display), ("mono", FontFamily.mono)] {
            let token = try #require(fonts[key] as? [String: Any])
            let names = try #require(token["$value"] as? [String])
            #expect(names.first == family)
        }
    }
}
