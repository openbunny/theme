import OpenBunnyTheme
import SwiftUI
import Testing

@testable import OpenBunnyUI

@Suite struct StatusTests {
    @Test func enabledIsValidAndOthersAreExpired() {
        #expect(Status.enabled.color == .valid)
        #expect(Status.disabled.color == .expired)
        #expect(Status.unavailable.color == .expired)
    }

    @Test func everyStatusHasAColor() {
        #expect(Status.allCases.count == 3)
    }
}
