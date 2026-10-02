import OpenBunnyTheme
import SwiftUI

extension Font {
    public static let themeCaption = Font.custom(
        FontFamily.display, size: TextSize.caption, relativeTo: .caption)
    public static let themeBody = Font.custom(
        FontFamily.display, size: TextSize.body, relativeTo: .body)
    public static let themeHeading = Font.custom(
        FontFamily.display, size: TextSize.heading, relativeTo: .headline
    ).weight(FontWeights.bold)
    public static let themeTitle = Font.custom(
        FontFamily.display, size: TextSize.title, relativeTo: .title
    ).weight(FontWeights.bold)
    public static let themeMono = Font.custom(
        FontFamily.mono, size: TextSize.body, relativeTo: .body)
}
