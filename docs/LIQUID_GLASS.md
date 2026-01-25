# Liquid Glass (iOS 26) + New Architecture Guide

This app now uses **iOS 26 Liquid Glass** effects and the **React Native New Architecture**.

## 1) New Architecture (enabled)

Enabled in `app.json`:
- `expo.newArchEnabled = true`

### Important: Dev Client Required

For iOS 26 features and New Architecture, you must use a **Dev Client** or **EAS build**:
```bash
npx expo run:ios
```

## 2) iOS 26 Native Features Added

### Native Stack Headers with Blur
The Stack navigator now uses native iOS blur effects on headers:
```tsx
<Stack
  screenOptions={{
    headerTransparent: Platform.OS === 'ios',
    headerBlurEffect: 'systemMaterial',
  }}
>
```

Available blur effects:
- `systemMaterial`, `systemChromeMaterial`, `systemUltraThinMaterial`
- `extraLight`, `light`, `dark`, `regular`, `prominent`

### expo-glass-effect Package
Installed `expo-glass-effect` for native iOS 26 Liquid Glass effects.

## 3) Glass Component (upgraded)

File: `components/Glass.tsx`

The Glass component now automatically uses:
- **iOS 26+**: Native `GlassView` from `expo-glass-effect` with true Liquid Glass
- **iOS < 26 / Android**: `expo-blur` fallback with translucent overlays
- **Web**: Translucent overlay only (no blur)

### Usage
```tsx
import Glass from '@/components/Glass';

<Glass style={{ padding: 12 }} intensity={35} isInteractive>
  <Text>Glass content</Text>
</Glass>
```

### Props
- `style`: ViewStyle
- `intensity`: Blur intensity (default: 28)
- `tint`: 'light' | 'dark' | 'default'
- `isInteractive`: Enable interactive touch effects on iOS 26+

## 4) Where Glass is Applied

### A) Floating Header (Home Screen)
The map floating header uses Glass for a frosted effect:
```tsx
<Glass style={styles.headerContainer} intensity={35} isInteractive>
  {/* Search bar, avatar, buttons */}
</Glass>
```

### B) Bottom Sheets
All bottom sheets use Glass backgrounds:
```tsx
function GlassSheetBackground({ style }) {
  return <Glass style={[style, { borderRadius: 32 }]} intensity={40} />;
}

<BottomSheetModal backgroundComponent={GlassSheetBackground}>
```

### C) Submit Bar
The submit place form uses a Glass bottom bar:
```tsx
<Glass style={styles.submitBar} intensity={50}>
  <TouchableOpacity style={styles.submitButton}>
    <Text>Submit place</Text>
  </TouchableOpacity>
</Glass>
```

## 5) @expo/ui SwiftUI Components

The app includes `@expo/ui` for future SwiftUI component integration:
```tsx
import { Picker, Button, TextField } from '@expo/ui/swift-ui';
```

Available components include:
- Button, Picker, TextField, Toggle, Switch
- DatePicker, ColorPicker, Slider, Stepper
- BottomSheet, Menu, ContextMenu
- GlassEffectContainer, and more

## 6) Visual Defaults

Recommended glass styling:
- Blur intensity: `28-50`
- Overlay: `rgba(255,255,255,0.18)`
- Border: `rgba(255,255,255,0.22)`
- Border radius: `20-32`

## 7) Building for iOS 26

To see full Liquid Glass effects:

1. Use Xcode 26 or later
2. Build with iOS 26 SDK:
   ```bash
   npx expo run:ios
   ```
3. Test on iOS 26 simulator or device

## 8) Troubleshooting

- **Glass not showing on simulator**: Ensure you're running iOS 26+ simulator
- **Blur not visible**: Check `expo-blur` and `expo-glass-effect` are installed
- **New Architecture issues**: Clear cache with `npx expo start -c`
- **Web issues**: Glass degrades to translucent overlay (expected behavior)

## 9) Packages Added

```json
{
  "expo-glass-effect": "latest",
  "@expo/ui": "latest"
}
```
