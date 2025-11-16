# Building and Testing MitsuhaEngine Integration

## Prerequisites

- Node.js 18+
- npm or yarn
- **For iOS**: macOS with Xcode 16+
- **For Android**: Android Studio with SDK 24+

## Initial Setup

```bash
# Install dependencies
npm install

# Verify files are in place
ls -l ios/qobuzmobilev2/RNMitsuha*.swift
ls -l android/app/src/main/java/com/yagami073/qobuzmobilev2/RNMitsuha*.kt
```

## Building for iOS

### Step 1: Prebuild Native Project

```bash
# Generate iOS native project with config plugin
npx expo prebuild --platform ios --clean
```

The Expo config plugin (`plugins/withMitsuhaVisualizer.js`) will automatically:
- Copy Swift and Objective-C files to the native directory
- Update the bridging header
- Configure the project

### Step 2: Install CocoaPods

```bash
cd ios
pod install
cd ..
```

### Step 3: Build and Run

**Option A: Using Expo CLI (Recommended)**
```bash
npx expo run:ios
```

**Option B: Using Xcode**
```bash
# Open Xcode
open ios/qobuzmobilev2.xcworkspace

# Select a simulator or device
# Press Cmd+R to build and run
```

### Troubleshooting iOS

**Error: "View config not found for component RNMitsuhaVisualizer"**

1. Verify bridging header includes React imports:
```bash
cat ios/qobuzmobilev2/qobuzmobilev2-Bridging-Header.h
```

Should contain:
```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
```

2. Check files are in Xcode project:
- Open `ios/qobuzmobilev2.xcworkspace` in Xcode
- Look for `RNMitsuhaVisualizerView.swift` in Project Navigator
- If missing, add manually: Right-click on qobuzmobilev2 folder → Add Files

3. Clean build:
```bash
cd ios
rm -rf build
cd ..
npx expo prebuild --platform ios --clean
```

**Swift Compilation Errors**

Ensure iOS deployment target is 13.0+ in `app.json`:
```json
{
  "ios": {
    "deploymentTarget": "13.0"
  }
}
```

## Building for Android

### Step 1: Prebuild Native Project

```bash
# Generate Android native project
npx expo prebuild --platform android --clean
```

### Step 2: Build and Run

**Option A: Using Expo CLI (Recommended)**
```bash
npx expo run:android
```

**Option B: Using Gradle**
```bash
cd android
./gradlew assembleDebug
./gradlew installDebug
cd ..
```

### Troubleshooting Android

**Error: "Unable to find component RNMitsuhaVisualizer"**

1. Verify package is registered in `MainApplication.kt`:
```bash
grep -n "RNMitsuhaVisualizerPackage" android/app/src/main/java/com/yagami073/qobuzmobilev2/MainApplication.kt
```

Should show:
```kotlin
add(RNMitsuhaVisualizerPackage())
```

2. Clean and rebuild:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --platform android --clean
```

**Kotlin Version Issues**

Check `android/build.gradle` for Kotlin version:
```gradle
buildscript {
    ext {
        kotlinVersion = '1.9.0' // or higher
    }
}
```

## Testing the Visualizer

### 1. Start the App

After building, the app should launch on your device/simulator.

### 2. Navigate to Player

1. Login with Qobuz credentials (if required)
2. Search for a song
3. Tap on a song to start playing
4. The mini player appears at the bottom

### 3. View Visualizer

1. Tap on the mini player to expand it
2. The full player slides up
3. **You should see the MitsuhaVisualizer animating** between the album art and progress bar

### 4. Verify Animation

The visualizer should:
- ✓ Display a green waveform
- ✓ Animate smoothly at 60fps
- ✓ Show mirrored top and bottom waves (mitsuha style)
- ✓ Have a subtle glow effect
- ✓ Continue animating while playing

## Configuration Options

You can customize the visualizer in `FullPlayer.tsx`:

```tsx
<MitsuhaVisualizer
  style={styles.visualizer}
  barColor="#1DB954"       // Change color
  sensitivity={1.8}        // Adjust amplitude
  smoothness={0.25}        // Adjust animation smoothness
  waveStyle="mitsuha"      // "mitsuha" or "bar"
/>
```

## Development Workflow

### Making Changes to Native Code

**iOS:**
```bash
# 1. Edit Swift files in ios/qobuzmobilev2/
# 2. Rebuild
npx expo run:ios

# Or in Xcode: Cmd+B
```

**Android:**
```bash
# 1. Edit Kotlin files in android/app/src/main/java/...
# 2. Rebuild
npx expo run:android

# Or: cd android && ./gradlew assembleDebug
```

### Making Changes to React Native Component

```bash
# 1. Edit src/components/MitsuhaVisualizer.tsx
# 2. Metro bundler will reload automatically
# No rebuild needed!
```

## Common Issues

### Metro Bundler Issues

```bash
# Clear cache
npx expo start --clear

# Or
rm -rf node_modules
npm install
```

### Native Module Not Found

```bash
# iOS: Reinstall pods
cd ios && pod install && cd ..

# Android: Clean build
cd android && ./gradlew clean && cd ..

# Then rebuild
npx expo prebuild --clean
```

### Build Errors After Git Pull

```bash
# Full clean rebuild
rm -rf node_modules ios android
npm install
npx expo prebuild --clean
```

## Performance Monitoring

Monitor visualizer performance:

**iOS (Xcode):**
- Debug → Debug Workflow → Start Metal System Trace
- Check frame rate in Instruments

**Android (Android Studio):**
- View → Tool Windows → Profiler
- Monitor CPU and GPU usage

Target: 60fps with minimal CPU usage

## Next Steps

After verifying the visualizer works:

1. **Add real audio data**: Integrate expo-av audio analysis
2. **Customize colors**: Match app theme
3. **Add presets**: Create multiple visualization styles
4. **User settings**: Allow users to customize visualizer

See `MITSUHA_INTEGRATION.md` for more details on the implementation.
