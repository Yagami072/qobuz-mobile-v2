#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RNMitsuhaVisualizerViewManager, RCTViewManager)

// Props
RCT_EXPORT_VIEW_PROPERTY(barColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(barWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(barSpacing, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(sensitivity, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(smoothness, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(waveStyle, NSString)

// Methods
RCT_EXTERN_METHOD(setAudioLevel:(nonnull NSNumber *)reactTag level:(nonnull NSNumber *)level)

@end
