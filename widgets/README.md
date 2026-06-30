# widgets/ — home-screen widgets (staged for Batch B)

Widgets are the product wedge (a one-tap logger + a friend-activity glance), and they
require **native code** via config plugins applied at prebuild — so Oshi is a dev build
from day zero, **never Expo Go**.

These files are **staged source** authored during Batch A (free, no accounts). The actual
install + native build is **Batch B** (gated: EAS, Apple Developer Program, devices).

## Phase 0 exit gate
A **placeholder** widget renders on the home screen on **iOS and Android** — proving the
native pipeline before we build any features. (Phase 2 makes the logger widget interactive.)

## iOS — `ios/OshiWidget.swift`
WidgetKit / SwiftUI. Batch B wiring:
1. `npm i @bacons/apple-targets`
2. add `"@bacons/apple-targets"` to `plugins` in `app.config.ts`
3. add `expo-target.config.js` (WidgetKit target + App Group `group.com.oshi.app`)
4. drop `OshiWidget.swift` into the generated target
5. `npx expo prebuild -p ios` → `eas build --profile development -p ios`
Interactive taps (Phase 2) use **App Intents** (iOS 17+).

## Android — `android/oshi-widget.tsx`
`react-native-android-widget` (Glance/Kotlin under the hood). Batch B wiring:
1. `npm i react-native-android-widget`
2. add the plugin to `app.config.ts` with the widget registration
3. add a widget-task-handler entry
4. `npx expo prebuild -p android` → `eas build --profile development -p android`

> The Android `.tsx` imports a package that isn't installed in Batch A, so `widgets/`
> is excluded from the app `tsconfig` and is not part of the Metro graph yet.
