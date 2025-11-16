import UIKit
import AVFoundation

@objc(RNMitsuhaVisualizerView)
class RNMitsuhaVisualizerView: UIView {
  
  private var displayLink: CADisplayLink?
  private var waveLayers: [CAShapeLayer] = []
  private let numberOfBars: Int = 40
  private var audioLevel: Float = 0.0
  private var targetLevels: [CGFloat] = []
  private var currentLevels: [CGFloat] = []
  private var phase: CGFloat = 0.0
  
  // Customizable properties
  @objc var barColor: UIColor = UIColor(red: 29/255, green: 185/255, blue: 84/255, alpha: 1.0) {
    didSet {
      updateColors()
    }
  }
  
  @objc var barWidth: CGFloat = 3.0
  @objc var barSpacing: CGFloat = 2.0
  @objc var sensitivity: CGFloat = 1.5
  @objc var smoothness: CGFloat = 0.2
  @objc var waveStyle: String = "mitsuha" // "mitsuha" or "bar"
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    setupView()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupView()
  }
  
  private func setupView() {
    backgroundColor = .clear
    clipsToBounds = true
    
    // Initialize levels
    targetLevels = Array(repeating: 0.0, count: numberOfBars)
    currentLevels = Array(repeating: 0.0, count: numberOfBars)
    
    // Setup display link for animation
    displayLink = CADisplayLink(target: self, selector: #selector(updateAnimation))
    displayLink?.add(to: .main, forMode: .common)
    displayLink?.preferredFramesPerSecond = 60
  }
  
  private func updateColors() {
    for layer in waveLayers {
      layer.fillColor = barColor.cgColor
      layer.strokeColor = barColor.cgColor
    }
  }
  
  @objc private func updateAnimation() {
    guard bounds.width > 0 && bounds.height > 0 else { return }
    
    // Update phase for wave animation
    phase += 0.05
    if phase > .pi * 2 {
      phase = 0
    }
    
    // Generate random-ish levels if no audio data (for demo)
    // In production, this should be driven by actual audio analysis
    for i in 0..<numberOfBars {
      let waveValue = sin(phase + CGFloat(i) * 0.3) * 0.5 + 0.5
      let randomFactor = CGFloat.random(in: 0.8...1.2)
      targetLevels[i] = waveValue * randomFactor * sensitivity
    }
    
    // Smooth interpolation
    for i in 0..<numberOfBars {
      currentLevels[i] += (targetLevels[i] - currentLevels[i]) * smoothness
    }
    
    // Draw based on style
    if waveStyle == "mitsuha" {
      drawMitsuhaStyle()
    } else {
      drawBarStyle()
    }
  }
  
  private func drawMitsuhaStyle() {
    // Clear previous layers
    waveLayers.forEach { $0.removeFromSuperlayer() }
    waveLayers.removeAll()
    
    let centerY = bounds.height / 2
    let totalWidth = bounds.width
    let spacing = totalWidth / CGFloat(numberOfBars)
    
    // Create path for wave
    let path = UIBezierPath()
    var isFirst = true
    
    // Top wave
    for i in 0..<numberOfBars {
      let x = CGFloat(i) * spacing
      let amplitude = currentLevels[i] * (bounds.height / 3)
      let y = centerY - amplitude
      
      if isFirst {
        path.move(to: CGPoint(x: x, y: y))
        isFirst = false
      } else {
        path.addLine(to: CGPoint(x: x, y: y))
      }
    }
    
    // Bottom wave (mirror)
    for i in (0..<numberOfBars).reversed() {
      let x = CGFloat(i) * spacing
      let amplitude = currentLevels[i] * (bounds.height / 3)
      let y = centerY + amplitude
      path.addLine(to: CGPoint(x: x, y: y))
    }
    
    path.close()
    
    // Create gradient layer
    let shapeLayer = CAShapeLayer()
    shapeLayer.path = path.cgPath
    shapeLayer.fillColor = barColor.cgColor
    shapeLayer.opacity = 0.8
    
    // Add glow effect
    shapeLayer.shadowColor = barColor.cgColor
    shapeLayer.shadowOffset = .zero
    shapeLayer.shadowRadius = 10
    shapeLayer.shadowOpacity = 0.6
    
    layer.addSublayer(shapeLayer)
    waveLayers.append(shapeLayer)
  }
  
  private func drawBarStyle() {
    // Clear previous layers
    waveLayers.forEach { $0.removeFromSuperlayer() }
    waveLayers.removeAll()
    
    let centerY = bounds.height / 2
    let totalWidth = bounds.width - (barSpacing * CGFloat(numberOfBars - 1))
    let calculatedBarWidth = totalWidth / CGFloat(numberOfBars)
    let actualBarWidth = min(calculatedBarWidth, barWidth)
    
    for i in 0..<numberOfBars {
      let x = CGFloat(i) * (actualBarWidth + barSpacing)
      let amplitude = currentLevels[i] * (bounds.height / 2)
      
      // Create bar
      let barLayer = CAShapeLayer()
      let barPath = UIBezierPath(roundedRect: CGRect(
        x: x,
        y: centerY - amplitude,
        width: actualBarWidth,
        height: amplitude * 2
      ), cornerRadius: actualBarWidth / 2)
      
      barLayer.path = barPath.cgPath
      barLayer.fillColor = barColor.cgColor
      
      // Add glow
      barLayer.shadowColor = barColor.cgColor
      barLayer.shadowOffset = .zero
      barLayer.shadowRadius = 5
      barLayer.shadowOpacity = 0.5
      
      layer.addSublayer(barLayer)
      waveLayers.append(barLayer)
    }
  }
  
  @objc func setAudioLevel(_ level: NSNumber) {
    audioLevel = level.floatValue
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    // Redraw when bounds change
  }
  
  deinit {
    displayLink?.invalidate()
    displayLink = nil
  }
}
