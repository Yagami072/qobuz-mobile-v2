import React from 'react';
import { requireNativeComponent, ViewStyle, Platform, ColorValue } from 'react-native';

export interface MitsuhaVisualizerProps {
  style?: ViewStyle;
  barColor?: ColorValue;
  barWidth?: number;
  barSpacing?: number;
  sensitivity?: number;
  smoothness?: number;
  waveStyle?: 'mitsuha' | 'bar';
}

const NativeMitsuhaVisualizer = requireNativeComponent<MitsuhaVisualizerProps>(
  'RNMitsuhaVisualizer'
);

const MitsuhaVisualizer: React.FC<MitsuhaVisualizerProps> = ({
  style,
  barColor = '#1DB954',
  barWidth = 3,
  barSpacing = 2,
  sensitivity = 1.5,
  smoothness = 0.2,
  waveStyle = 'mitsuha',
}) => {
  return (
    <NativeMitsuhaVisualizer
      style={style}
      barColor={barColor}
      barWidth={barWidth}
      barSpacing={barSpacing}
      sensitivity={sensitivity}
      smoothness={smoothness}
      waveStyle={waveStyle as 'mitsuha' | 'bar'}
    />
  );
};

export default MitsuhaVisualizer;
