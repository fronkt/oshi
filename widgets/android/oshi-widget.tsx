// Placeholder Oshi Android widget (Batch A staging — see widgets/README.md).
// Wired in Batch B via `react-native-android-widget` (+ its config plugin and a
// widget-task-handler entry). Not in the Metro graph and excluded from tsconfig
// until the lib is installed in Batch B.

import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function OshiWidget() {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#0B0B12",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
      }}
    >
      <TextWidget text="推し" style={{ fontSize: 24, color: "#FFFFFF" }} />
      <TextWidget text="Oshi" style={{ fontSize: 12, color: "#9CA3AF" }} />
    </FlexWidget>
  );
}
