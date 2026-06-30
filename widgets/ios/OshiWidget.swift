// Placeholder Oshi iOS widget (Batch A staging — see widgets/README.md).
// Wired in Batch B via @bacons/apple-targets (expo-target.config.js + App Group
// group.com.oshi.app). Phase 2 makes it interactive (App Intents) for the logger.

import WidgetKit
import SwiftUI

struct OshiEntry: TimelineEntry {
  let date: Date
}

struct OshiProvider: TimelineProvider {
  func placeholder(in context: Context) -> OshiEntry { OshiEntry(date: Date()) }

  func getSnapshot(in context: Context, completion: @escaping (OshiEntry) -> Void) {
    completion(OshiEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<OshiEntry>) -> Void) {
    completion(Timeline(entries: [OshiEntry(date: Date())], policy: .never))
  }
}

struct OshiWidgetView: View {
  var entry: OshiEntry

  var body: some View {
    ZStack {
      Color(red: 0.043, green: 0.043, blue: 0.071)
      VStack(spacing: 4) {
        Text("推し").font(.title).foregroundColor(.white)
        Text("Oshi").font(.caption).foregroundColor(.gray)
      }
    }
  }
}

@main
struct OshiWidget: Widget {
  let kind = "OshiWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: OshiProvider()) { entry in
      OshiWidgetView(entry: entry)
    }
    .configurationDisplayName("Oshi")
    .description("Your friends' anime activity, at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
