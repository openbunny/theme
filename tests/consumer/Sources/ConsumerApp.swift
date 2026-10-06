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
                PageSection(number: "01", title: "section") {
                    ShellCommandLine(command: "tool --flag value")
                    KeyValueGroup(title: "group") {
                        KeyValueRow(key: "key", value: "value")
                    }
                    StatusMessage("message", tone: .valid)
                    Chip("chip")
                }
                Button("link") {}.buttonStyle(.inkLink)
                Button("outline") {}.buttonStyle(.outline)
            }
            .padding(Spacing.page)
            .openbunnyTheme()
        }
    }
}
