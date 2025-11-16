package com.yagami073.qobuzmobilev2

import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class RNMitsuhaVisualizerViewManager : SimpleViewManager<RNMitsuhaVisualizerView>() {
    
    override fun getName() = "RNMitsuhaVisualizer"
    
    override fun createViewInstance(reactContext: ThemedReactContext): RNMitsuhaVisualizerView {
        return RNMitsuhaVisualizerView(reactContext)
    }
    
    @ReactProp(name = "barColor")
    fun setBarColor(view: RNMitsuhaVisualizerView, color: Int?) {
        color?.let {
            view.barColorValue = it
        }
    }
    
    @ReactProp(name = "barWidth")
    fun setBarWidth(view: RNMitsuhaVisualizerView, width: Float) {
        view.barWidthValue = width
    }
    
    @ReactProp(name = "barSpacing")
    fun setBarSpacing(view: RNMitsuhaVisualizerView, spacing: Float) {
        view.barSpacingValue = spacing
    }
    
    @ReactProp(name = "sensitivity")
    fun setSensitivity(view: RNMitsuhaVisualizerView, sensitivity: Float) {
        view.sensitivityValue = sensitivity
    }
    
    @ReactProp(name = "smoothness")
    fun setSmoothness(view: RNMitsuhaVisualizerView, smoothness: Float) {
        view.smoothnessValue = smoothness
    }
    
    @ReactProp(name = "waveStyle")
    fun setWaveStyle(view: RNMitsuhaVisualizerView, style: String?) {
        style?.let {
            view.waveStyleValue = it
        }
    }
}
