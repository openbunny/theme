import OpenBunnyTheme
import SwiftUI

public struct FlatButtonStyle: ButtonStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.themeBody)
            .foregroundStyle(Color.foreground)
            .padding(.horizontal, Spacing.base)
            .padding(.vertical, Spacing.tight)
            .background(configuration.isPressed ? Color.paperInset : Color.paperDeep)
            .overlay(Rectangle().stroke(Color.border, lineWidth: Metric.borderWidth))
            .contentShape(Rectangle())
    }
}

extension ButtonStyle where Self == FlatButtonStyle {
    public static var flat: FlatButtonStyle { FlatButtonStyle() }
}
