# MitsuhaEngine Integration

## Overview

This project now includes a custom audio visualizer inspired by the Mitsuha 6 iOS tweak, providing a beautiful, fluid "gelatinous" waveform effect.

## Components

### Native Modules

#### iOS (Swift)
- **RNMitsuhaVisualizerView.swift**: Main view that renders the animated waveform using Core Animation
- **RNMitsuhaVisualizerViewManager.swift**: React Native view manager
- **RNMitsuhaVisualizerViewManager.m**: Objective-C bridge

#### Android (Kotlin)
- **RNMitsuhaVisualizerView.kt**: Main view that renders the animated waveform using Canvas
- **RNMitsuhaVisualizerViewManager.kt**: React Native view manager
- **RNMitsuhaVisualizerPackage.kt**: Package registration

### React Native Component

**src/components/MitsuhaVisualizer.tsx**: React wrapper component with TypeScript types

## Usage

```tsx
import MitsuhaVisualizer from './components/MitsuhaVisualizer';

<MitsuhaVisualizer
  style={{ width: '100%', height: 80 }}
  barColor="#1DB954"
  sensitivity={1.8}
  smoothness={0.25}
  waveStyle="mitsuha"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `ViewStyle` | - | Container style |
| `barColor` | `ColorValue` | `'#1DB954'` | Color of the waveform |
| `barWidth` | `number` | `3` | Width of individual bars (bar style only) |
| `barSpacing` | `number` | `2` | Spacing between bars (bar style only) |
| `sensitivity` | `number` | `1.5` | Amplitude multiplier |
| `smoothness` | `number` | `0.2` | Interpolation smoothness (0-1) |
| `waveStyle` | `'mitsuha' \| 'bar'` | `'mitsuha'` | Visualization style |

## Wave Styles

### Mitsuha Style
A fluid, gelatinous waveform that mirrors from the center, similar to the Mitsuha 6 visualizer. This style provides:
- Smooth wave animation
- Mirrored top and bottom waves
- Glow effect
- Continuous flowing motion

### Bar Style
Traditional bar equalizer with:
- Individual rounded bars
- Center-aligned growth
- Soft glow on each bar

## Implementation Details

### Animation
The visualizer uses 60fps animations with:
- Sine wave generation for smooth motion
- Interpolated transitions for fluid movement
- CAShapeLayer (iOS) / Canvas (Android) for performant rendering
- Shadow/glow effects for visual depth

### Performance
- Native rendering for optimal performance
- Minimal JavaScript bridge overhead
- Configurable frame rate
- Smooth 60fps animation on both platforms

## Integration in FullPlayer

The visualizer is integrated into the `FullPlayer` component between the track info and progress bar:

```tsx
<View style={styles.visualizerContainer}>
  <MitsuhaVisualizer
    style={styles.visualizer}
    barColor="#1DB954"
    sensitivity={1.8}
    smoothness={0.25}
    waveStyle="mitsuha"
  />
</View>
```

## Future Enhancements

- [ ] Real-time audio data integration (currently uses sine wave demo)
- [ ] FFT-based frequency analysis
- [ ] Multiple color gradients
- [ ] Custom particle effects
- [ ] User-configurable presets
- [ ] Audio reactivity based on actual playback

## Configuration Plugin

The project includes an Expo config plugin (`plugins/withMitsuhaVisualizer.js`) that automatically:
- Copies native files during prebuild
- Updates the iOS bridging header
- Ensures proper project configuration

## Building

### iOS
```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
npx expo run:ios
```

### Android
```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

## Troubleshooting

### iOS: "View config not found for component RNMitsuhaVisualizer"
- Run `npx expo prebuild --platform ios --clean`
- Ensure bridging header includes React imports
- Check that Swift files are added to the Xcode project

### Android: Build errors
- Ensure Kotlin version is compatible
- Clean and rebuild: `cd android && ./gradlew clean && cd ..`
- Check that the package is registered in MainApplication.kt

## Credits

Inspired by the Mitsuha and Mitsuha Forever iOS tweaks by c0ldra1n and ConorTheDev.
