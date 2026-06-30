import { ExpoConfig } from "expo/config";

/**
 * Oshi — typed Expo app config (replaces app.json).
 *
 * CNG / prebuild: native dirs (`/ios`, `/android`) are NOT committed — they're
 * regenerated from this config. So the app is a dev build from day zero, never Expo Go
 * (widgets need native code via config plugins).
 *
 * Batch B (gated, costs money / needs accounts) adds:
 *   - `extra.eas.projectId` (from `eas init`)
 *   - iOS App Group `group.com.oshi.app` + a WidgetKit target (@bacons/apple-targets)
 *   - the `react-native-android-widget` plugin
 * Those plugin entries are intentionally left out here so Batch A stays buildable/typed
 * without the widget libs installed.
 */
const config: ExpoConfig = {
  name: "Oshi",
  slug: "oshi",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "oshi", // OAuth redirect: oshi://auth/callback
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.oshi.app",
    supportsTablet: false,
    // Batch B: entitlements + App Group "group.com.oshi.app" for widget <-> app shared storage
  },
  android: {
    package: "com.oshi.app",
    adaptiveIcon: {
      backgroundColor: "#0B0B12",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0B0B12",
        android: { image: "./assets/images/splash-icon.png", imageWidth: 76 },
      },
    ],
    // Batch B widget plugins go here (after installing the widget libs):
    //   "@bacons/apple-targets",
    //   ["react-native-android-widget", { widgets: [{ name: "Oshi", ... }] }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    // Client-safe only. Server secrets live in Supabase function secrets, never the bundle.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // eas: { projectId: "<filled by `eas init` in Batch B>" },
  },
};

export default config;
