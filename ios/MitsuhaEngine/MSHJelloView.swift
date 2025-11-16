//
//  MSHJelloView.swift
//  MitsuhaEngine
//
//  Jello/gelatinous audio visualization view
//

import UIKit
import AVFoundation

@objc public class MSHJelloView: UIView {
    
    // MARK: - Public Properties
    @objc public var numberOfPoints: Int = 8
    @objc public var waveColor: UIColor = .systemBlue {
        didSet {
            shapeLayer?.fillColor = waveColor.cgColor
        }
    }
    @objc public var idleAmplitude: CGFloat = 0.05
    @objc public var amplitude: CGFloat = 0.05
    @objc public var damping: CGFloat = 0.8
    @objc public var stiffness: CGFloat = 0.3
    
    // MARK: - Private Properties
    private var shapeLayer: CAShapeLayer?
    private var displayLink: CADisplayLink?
    private var pointsVelocity: [CGFloat] = []
    private var pointsAmplitude: [CGFloat] = []
    private var phase: CGFloat = 0.0
    
    // MARK: - Initialization
    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }
    
    private func setup() {
        backgroundColor = .clear
        
        shapeLayer = CAShapeLayer()
        shapeLayer?.fillColor = waveColor.withAlphaComponent(0.3).cgColor
        shapeLayer?.strokeColor = waveColor.cgColor
        shapeLayer?.lineWidth = 2.0
        
        if let shapeLayer = shapeLayer {
            layer.addSublayer(shapeLayer)
        }
        
        // Initialize arrays
        pointsVelocity = Array(repeating: 0.0, count: numberOfPoints)
        pointsAmplitude = Array(repeating: idleAmplitude, count: numberOfPoints)
        
        startDisplayLink()
    }
    
    // MARK: - Display Link
    private func startDisplayLink() {
        displayLink = CADisplayLink(target: self, selector: #selector(updateJello))
        displayLink?.add(to: .main, forMode: .common)
    }
    
    private func stopDisplayLink() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    @objc private func updateJello() {
        phase += 0.05
        
        // Update physics simulation for each point
        for i in 0..<numberOfPoints {
            let targetAmplitude = amplitude + idleAmplitude
            let displacement = targetAmplitude - pointsAmplitude[i]
            let force = displacement * stiffness
            pointsVelocity[i] = (pointsVelocity[i] + force) * damping
            pointsAmplitude[i] += pointsVelocity[i]
        }
        
        updateJelloPath()
    }
    
    // MARK: - Jello Drawing
    private func updateJelloPath() {
        let width = bounds.width
        let height = bounds.height
        let midHeight = height / 2.0
        
        let path = UIBezierPath()
        
        // Start from bottom left
        path.move(to: CGPoint(x: 0, y: height))
        
        // Draw bottom line
        path.addLine(to: CGPoint(x: width, y: height))
        
        // Create control points for the jello effect
        var controlPoints: [CGPoint] = []
        
        for i in 0...numberOfPoints {
            let x = (CGFloat(i) / CGFloat(numberOfPoints)) * width
            let waveOffset = sin(phase + CGFloat(i) * 0.5) * pointsAmplitude[min(i, numberOfPoints - 1)] * height
            let y = midHeight + waveOffset
            controlPoints.append(CGPoint(x: x, y: y))
        }
        
        // Draw the top jello curve using control points
        path.addLine(to: CGPoint(x: width, y: controlPoints.last?.y ?? midHeight))
        
        // Create smooth curve through control points
        for i in stride(from: controlPoints.count - 1, to: 0, by: -1) {
            if i > 0 {
                let current = controlPoints[i]
                let previous = controlPoints[i - 1]
                let controlPoint = CGPoint(
                    x: (current.x + previous.x) / 2,
                    y: (current.y + previous.y) / 2
                )
                path.addQuadCurve(to: previous, controlPoint: current)
            }
        }
        
        path.close()
        
        shapeLayer?.path = path.cgPath
    }
    
    // MARK: - Public Methods
    @objc public func update(with level: Float) {
        amplitude = CGFloat(level) * 0.5
    }
    
    @objc public func reset() {
        amplitude = idleAmplitude
        pointsVelocity = Array(repeating: 0.0, count: numberOfPoints)
        pointsAmplitude = Array(repeating: idleAmplitude, count: numberOfPoints)
    }
    
    // MARK: - Lifecycle
    public override func layoutSubviews() {
        super.layoutSubviews()
        shapeLayer?.frame = bounds
        updateJelloPath()
    }
    
    deinit {
        stopDisplayLink()
    }
}
