package com.yagami073.qobuzmobilev2

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Color
import android.view.View
import kotlin.math.sin
import kotlin.math.PI

class RNMitsuhaVisualizerView(context: Context) : View(context) {
    
    private val numberOfBars = 40
    private var audioLevel: Float = 0f
    private val targetLevels = FloatArray(numberOfBars) { 0f }
    private val currentLevels = FloatArray(numberOfBars) { 0f }
    private var phase: Float = 0f
    
    // Customizable properties
    var barColorValue: Int = Color.rgb(29, 185, 84)
        set(value) {
            field = value
            paint.color = value
            invalidate()
        }
    
    var barWidthValue: Float = 3f
    var barSpacingValue: Float = 2f
    var sensitivityValue: Float = 1.5f
    var smoothnessValue: Float = 0.2f
    var waveStyleValue: String = "mitsuha"
    
    private val paint = Paint().apply {
        color = barColorValue
        style = Paint.Style.FILL
        isAntiAlias = true
        setShadowLayer(10f, 0f, 0f, barColorValue)
    }
    
    private val path = Path()
    private var animationRunnable: Runnable? = null
    
    init {
        setLayerType(LAYER_TYPE_SOFTWARE, null) // Enable shadow layer
        startAnimation()
    }
    
    private fun startAnimation() {
        animationRunnable = object : Runnable {
            override fun run() {
                updateAnimation()
                invalidate()
                postDelayed(this, 16) // ~60fps
            }
        }
        post(animationRunnable)
    }
    
    private fun updateAnimation() {
        // Update phase for wave animation
        phase += 0.05f
        if (phase > PI.toFloat() * 2) {
            phase = 0f
        }
        
        // Generate wave levels
        for (i in 0 until numberOfBars) {
            val waveValue = sin(phase + i * 0.3f) * 0.5f + 0.5f
            val randomFactor = (0.8f + Math.random().toFloat() * 0.4f)
            targetLevels[i] = waveValue * randomFactor * sensitivityValue
        }
        
        // Smooth interpolation
        for (i in 0 until numberOfBars) {
            currentLevels[i] += (targetLevels[i] - currentLevels[i]) * smoothnessValue
        }
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        if (width <= 0 || height <= 0) return
        
        when (waveStyleValue) {
            "mitsuha" -> drawMitsuhaStyle(canvas)
            else -> drawBarStyle(canvas)
        }
    }
    
    private fun drawMitsuhaStyle(canvas: Canvas) {
        path.reset()
        
        val centerY = height / 2f
        val spacing = width.toFloat() / numberOfBars
        
        // Top wave
        var isFirst = true
        for (i in 0 until numberOfBars) {
            val x = i * spacing
            val amplitude = currentLevels[i] * (height / 3f)
            val y = centerY - amplitude
            
            if (isFirst) {
                path.moveTo(x, y)
                isFirst = false
            } else {
                path.lineTo(x, y)
            }
        }
        
        // Bottom wave (mirror)
        for (i in numberOfBars - 1 downTo 0) {
            val x = i * spacing
            val amplitude = currentLevels[i] * (height / 3f)
            val y = centerY + amplitude
            path.lineTo(x, y)
        }
        
        path.close()
        
        // Draw with transparency
        paint.alpha = 204 // 0.8 * 255
        canvas.drawPath(path, paint)
    }
    
    private fun drawBarStyle(canvas: Canvas) {
        val centerY = height / 2f
        val totalWidth = width - (barSpacingValue * (numberOfBars - 1))
        val calculatedBarWidth = totalWidth / numberOfBars
        val actualBarWidth = minOf(calculatedBarWidth, barWidthValue)
        
        for (i in 0 until numberOfBars) {
            val x = i * (actualBarWidth + barSpacingValue)
            val amplitude = currentLevels[i] * (height / 2f)
            
            val left = x
            val top = centerY - amplitude
            val right = x + actualBarWidth
            val bottom = centerY + amplitude
            
            canvas.drawRoundRect(
                left, top, right, bottom,
                actualBarWidth / 2, actualBarWidth / 2,
                paint
            )
        }
    }
    
    fun setAudioLevel(level: Float) {
        audioLevel = level
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        animationRunnable?.let { removeCallbacks(it) }
    }
}
