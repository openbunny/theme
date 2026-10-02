import OpenBunnyTheme
import SwiftUI

public enum Status: Sendable, CaseIterable {
    case enabled
    case disabled
    case unavailable

    public var color: Color {
        switch self {
        case .enabled: .valid
        case .disabled, .unavailable: .expired
        }
    }
}

public struct StatusText: View {
    private let text: LocalizedStringKey
    private let status: Status

    public init(_ text: LocalizedStringKey, status: Status) {
        self.text = text
        self.status = status
    }

    public var body: some View {
        Text(text).foregroundStyle(status.color)
    }
}
