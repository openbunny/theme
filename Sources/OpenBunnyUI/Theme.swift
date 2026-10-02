import OpenBunnyTheme
import SwiftUI

extension View {
    public func openbunnyTheme() -> some View {
        font(.themeBody)
            .foregroundStyle(Color.foreground)
            .tint(Color.sprout)
            .background(Color.background)
            .preferredColorScheme(Scheme.colorScheme)
    }
}
