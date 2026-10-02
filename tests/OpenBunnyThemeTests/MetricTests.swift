import CoreGraphics
import Foundation
import Testing

@testable import OpenBunnyTheme

@Suite struct MetricTests {
    private let expectedSizes: [String: CGFloat] = [
        "caption": TextSize.caption, "body": TextSize.body,
        "heading": TextSize.heading, "title": TextSize.title,
    ]
    private let expectedSpace: [String: CGFloat] = [
        "tight": Spacing.tight, "base": Spacing.base,
        "loose": Spacing.loose, "page": Spacing.page,
    ]

    private func native(_ group: String) throws -> [String: CGFloat] {
        let native = try TokenFile("native").group("native")
        let tokens = try #require(native[group] as? [String: Any])
        var values: [String: CGFloat] = [:]
        for (key, token) in tokens {
            guard let token = token as? [String: Any] else { continue }
            values[key] = CGFloat(try #require(token["$value"] as? Double))
        }
        return values
    }

    @Test func textSizesEqualTokens() throws {
        let sizes = try native("size")
        #expect(!sizes.isEmpty)
        #expect(sizes == expectedSizes)
    }

    @Test func spacingEqualsTokens() throws {
        let space = try native("space")
        #expect(!space.isEmpty)
        #expect(space == expectedSpace)
    }

    @Test func everyRadiusIsSquare() {
        let radii = [
            Radius.sm, Radius.md, Radius.lg, Radius.xl, Radius.n2xl, Radius.n3xl, Radius.n4xl,
        ]
        #expect(radii == Array(repeating: 0, count: 7))
    }

    @Test func borderAndFocusEqualTokens() {
        #expect(Metric.borderWidth == 1)
        #expect(Metric.focusOutlineWidth == 2)
        #expect(Metric.focusOutlineOffset == 2)
    }
}
