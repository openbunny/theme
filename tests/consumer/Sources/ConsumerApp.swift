import OpenBunnyTheme
import OpenBunnyUI
import SwiftUI

@main
struct ConsumerApp: App {
    init() {
        do {
            try Fonts.register()
        } catch {
            fatalError(error.localizedDescription)
        }
    }

    var body: some Scene {
        WindowGroup {
            VStack(alignment: .leading, spacing: Spacing.base) {
                Text("Consumer").font(.themeTitle)
                StatusText("Enabled", status: .enabled)
                StatusText("Disabled", status: .disabled)
                Button("Settings") {}.buttonStyle(.flat)
            }
            .padding(Spacing.page)
            .openbunnyTheme()
        }
    }
}
