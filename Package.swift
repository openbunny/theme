// swift-tools-version: 6.2
import PackageDescription

let strict: [SwiftSetting] = [.strictMemorySafety(), .treatAllWarnings(as: .error)]

let package = Package(
    name: "OpenBunnyTheme",
    platforms: [.macOS(.v15)],
    products: [
        .library(name: "OpenBunnyTheme", targets: ["OpenBunnyTheme"]),
        .library(name: "OpenBunnyUI", targets: ["OpenBunnyUI"]),
    ],
    targets: [
        .target(
            name: "OpenBunnyTheme",
            resources: [.copy("Resources")],
            swiftSettings: strict
        ),
        .target(
            name: "OpenBunnyUI",
            dependencies: ["OpenBunnyTheme"],
            swiftSettings: strict
        ),
        .testTarget(
            name: "OpenBunnyThemeTests",
            dependencies: ["OpenBunnyTheme"],
            path: "tests/OpenBunnyThemeTests",
            swiftSettings: strict
        ),
        .testTarget(
            name: "OpenBunnyUITests",
            dependencies: ["OpenBunnyUI", "OpenBunnyTheme"],
            path: "tests/OpenBunnyUITests",
            swiftSettings: strict
        ),
    ],
    swiftLanguageModes: [.v6]
)
