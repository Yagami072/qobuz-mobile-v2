# MitsuhaEngine Visual Demo

This document shows what the integrated MitsuhaEngine visualizer looks like in the app.

## Component Hierarchy

```
SearchScreen / PlayerScreen
  └── FullPlayerWrapper
       └── FullPlayer (when expanded)
            ├── Header (drag indicator, close button)
            ├── Album Art (with glow animation)
            ├── Track Info (title, artist, album)
            ├── 🆕 MitsuhaVisualizer ← NEW!
            │    └── Animated waveform (80px height)
            ├── Progress Bar (slider + time labels)
            ├── Controls (prev, play/pause, next)
            └── Additional Controls (shuffle, repeat, queue, etc.)
```

## Visual Layout

```
┌─────────────────────────────────────┐
│  ━━━━━━━━━━━━━━  (drag indicator)  │
│  ▼ Close                            │
│                                     │
│      ┌─────────────────┐            │
│      │                 │            │
│      │   Album  Art    │            │
│      │    (300x300)    │            │
│      │                 │            │
│      └─────────────────┘            │
│                                     │
│       Track Title                   │
│       Artist Name                   │
│       Album Name                    │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  🌊 MITSUHA VISUALIZER 🌊      ││  ← NEW!
│  │  ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲         ││
│  │ ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲        ││
│  │╱    ╲╱    ╲╱    ╲╱    ╲       ││
│  └─────────────────────────────────┘│
│                                     │
│  ├──────●──────────────────┤        │  (progress bar)
│  0:45                      3:24     │
│                                     │
│    ⏮  ⏪  ▶️  ⏩  ⏭                │  (controls)
│                                     │
│   🔀  🔁  📋  ❤️  ➕              │  (additional)
└─────────────────────────────────────┘
```

## Waveform Styles

### Mitsuha Style (Default)
```
     ╱╲      ╱╲      ╱╲      ╱╲
    ╱  ╲    ╱  ╲    ╱  ╲    ╱  ╲
───╱────╲──╱────╲──╱────╲──╱────╲───  (center line)
   ╲    ╱  ╲    ╱  ╲    ╱  ╲    ╱
    ╲  ╱    ╲  ╱    ╲  ╱    ╲  ╱
     ╲╱      ╲╱      ╲╱      ╲╱
```
- Fluid, gelatinous wave
- Mirrored top and bottom
- Smooth sine wave motion
- Green glow (#1DB954)

### Bar Style
```
 ▂▃▅▇█▇▅▃▂ ▂▃▅▇█▇▅▃▂ ▂▃▅▇█▇▅▃▂
─────────────────────────────────  (center)
 ▔▔▔▔▔▔▔▔▔ ▔▔▔▔▔▔▔▔▔ ▔▔▔▔▔▔▔▔▔
```
- Individual rounded bars
- Center-aligned growth
- Classic equalizer style

## Animation Characteristics

- **Frame Rate**: 60 FPS
- **Wave Speed**: Smooth and continuous
- **Color**: Spotify Green (#1DB954) with glow
- **Height**: 80px
- **Sensitivity**: 1.8x (adjustable)
- **Smoothness**: 0.25 (interpolation factor)

## Technical Implementation

### iOS (Swift)
- Uses CAShapeLayer for vector graphics
- CoreAnimation for 60fps rendering
- Shadow layer for glow effect
- Automatic memory management

### Android (Kotlin)
- Uses Canvas API for drawing
- Custom View with animation loop
- Software layer for shadow effects
- Efficient invalidate() calls

### React Native Bridge
- Zero overhead during animation
- Native component registration
- TypeScript type safety
- Configurable props

## User Experience

When playing a track:
1. User taps to expand mini player to full player
2. Full player slides up with animation
3. **Visualizer immediately starts animating**
4. Wave flows smoothly in sync with sine wave
5. User sees beautiful, gelatinous waveform
6. Creates engaging visual feedback

## Future Enhancements

The current implementation uses sine wave demo data. Future versions can integrate:

1. Real-time audio analysis via expo-av
2. FFT frequency data extraction
3. Multiple frequency bands
4. Color gradients based on frequency
5. User customizable themes
6. Beat detection and reactive effects
