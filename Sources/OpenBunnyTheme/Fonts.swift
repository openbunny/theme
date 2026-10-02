import CoreText
import Foundation

public enum FontError: Error, LocalizedError, Equatable {
    case resourceMissing(String)
    case registrationFailed(file: String, reason: String)
    case familyUnavailable(String)

    public var errorDescription: String? {
        switch self {
        case .resourceMissing(let file):
            "Font file \(file).ttf is missing from the OpenBunnyTheme bundle."
        case .registrationFailed(let file, let reason):
            "Registering \(file).ttf failed: \(reason)."
        case .familyUnavailable(let family):
            "Font family \(family) is not available after registration."
        }
    }
}

public enum Fonts {
    public static let files = [
        "CourierPrime-Regular", "CourierPrime-Bold",
        "JetBrainsMono-Regular", "JetBrainsMono-Bold",
    ]
    public static let families = [FontFamily.display, FontFamily.mono]

    public static func register() throws(FontError) {
        if let failure = outcome { throw failure }
    }

    private static let outcome: FontError? = registerAll()

    private static func registerAll() -> FontError? {
        for file in files {
            guard
                let url = Bundle.module.url(
                    forResource: file, withExtension: "ttf", subdirectory: "Resources")
            else { return .resourceMissing(file) }
            var error: Unmanaged<CFError>?
            let registered = unsafe CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
            if !registered {
                let failure = unsafe error?.takeRetainedValue()
                let alreadyRegistered =
                    failure.map {
                        CFErrorGetCode($0) == CTFontManagerError.alreadyRegistered.rawValue
                    }
                    ?? false
                if !alreadyRegistered {
                    return .registrationFailed(
                        file: file,
                        reason: failure.map { CFErrorCopyDescription($0) as String }
                            ?? "unknown error")
                }
            }
        }
        let available = (CTFontManagerCopyAvailableFontFamilyNames() as? [String]) ?? []
        return families.first { !available.contains($0) }.map(FontError.familyUnavailable)
    }
}
