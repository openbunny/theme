import OpenBunnyTheme
import SwiftUI

private struct ComponentGallery: View {
    private static let bannerHeight: CGFloat = 260
    private static let canvasWidth: CGFloat = 640
    private static let canvasHeight: CGFloat = 1_180

    private let fontFailure: FontError? = {
        do throws(FontError) {
            try Fonts.register()
            return nil
        } catch {
            return error
        }
    }()

    @State private var taps = 0
    @State private var field = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.loose) {
                if let fontFailure {
                    Text(fontFailure.localizedDescription).foregroundStyle(Color.foreground)
                }
                PageSection(number: "01", title: "page section", ruled: false) {
                    Text("the first section has no rule; every later one does.")
                }
                PageSection(number: "02", title: "command line and copy button") { commandSamples }
                PageSection(number: "03", title: "outline, link and flat buttons") { buttonSamples }
                PageSection(number: "04", title: "field, chip and key/value grid") { fieldSamples }
                PageSection(number: "05", title: "status messages") { statusSamples }
                PageSection(number: "06", title: "status banner") { bannerSample }
            }
            .padding(Spacing.loose)
        }
        .frame(width: Self.canvasWidth, height: Self.canvasHeight)
        .background(Color.paper)
        .openbunnyTheme()
    }

    @ViewBuilder private var commandSamples: some View {
        ShellCommandLine(
            command: #"tool --name "sample value" input.txt"#)
        CopyButton(text: "copied text", label: "copy sample text")
    }

    private var buttonSamples: some View {
        HStack(spacing: Spacing.base) {
            Button("enabled") { taps += 1 }.buttonStyle(.outline)
            Button("disabled") { taps += 1 }.buttonStyle(.outline).disabled(true)
            Button("link") { taps += 1 }.buttonStyle(.inkLink)
            Button("flat") { taps += 1 }.buttonStyle(.flat)
        }
    }

    @ViewBuilder private var fieldSamples: some View {
        LabeledField(label: "name", placeholder: "a value", text: $field)
        Chip("edited")
        KeyValueGroup(title: "document") {
            KeyValueRow(key: "version", value: "1.0")
            KeyValueRow(key: "checksum", value: "none")
        }
    }

    @ViewBuilder private var statusSamples: some View {
        StatusMessage("loaded. enter a value to continue.", tone: .neutral)
        StatusMessage("saved 2 items.", tone: .valid)
        StatusMessage(#""sample" was not found."#, tone: .failed)
        StatusText("enabled", status: .enabled)
        StatusText("disabled", status: .disabled)
    }

    private var bannerSample: some View {
        StatusBanner(title: "nothing open", message: "status banner with one action.") {
            Rectangle().stroke(Color.border, lineWidth: Metric.borderWidth)
        } actions: {
            Button("open…") { taps += 1 }.buttonStyle(.outline)
        }
        .frame(height: Self.bannerHeight)
    }
}

#Preview("Components") {
    ComponentGallery()
}
