//
//  MSHWaveView.swift
//  MitsuhaEngine
//
//  Audio visualization wave view
//

import UIKit
import AVFoundation

@objc public class MSHWaveView: UIView {
    
    // MARK: - Public Properties
    @objc public var numberOfWaves: Int = 5
    @objc public var waveColor: UIColor = .systemBlue
    @objc public var primaryWaveLineWidth: CGFloat = 3.0
    @objc public var secondaryWaveLineWidth: CGFloat = 1.0
    @objc public var idleAmplitude: CGFloat = 0.01
    @objc public var frequency: CGFloat = 1.5
    @objc public var density: CGFloat = 5.0
    @objc public var phaseShift: CGFloat = -0.15
    @objc public var amplitude: CGFloat = 1.0
    
    // MARK: - Private Properties
    private var phase: CGFloat = 0.0
    private var displayLink: CADisplayLink?
    private var waveLayer: CAShapeLayer?
    
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
        waveLayer = CAShapeLayer()
        waveLayer?.fillColor = UIColor.clear.cgColor
        waveLayer?.strokeColor = waveColor.cgColor
        waveLayer?.lineWidth = primaryWaveLineWidth
        waveLayer?.lineCap = .round
        waveLayer?.lineJoin = .round
        
        if let waveLayer = waveLayer {
            layer.addSublayer(waveLayer)
        }
        
        startDisplayLink()
    }
    
    // MARK: - Display Link
    private func startDisplayLink() {
        displayLink = CADisplayLink(target: self, selector: #selector(updateWave))
        displayLink?.add(to: .main, forMode: .common)
    }
    
    private func stopDisplayLink() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    @objc private func updateWave() {
        phase += phaseShift
        updateWavePath()
    }
    
    // MARK: - Wave Drawing
    private func updateWavePath() {
        let width = bounds.width
        let height = bounds.height
        let midHeight = height / 2.0
        
        let path = UIBezierPath()
        
        for wave in 0..<numberOfWaves {
            let progress = CGFloat(wave) / CGFloat(numberOfWaves)
            let normedAmplitude = (1.5 * progress - 0.5) * amplitude
            
            path.move(to: CGPoint(x: 0, y: midHeight))
            
            for x in stride(from: 0, through: width, by: density) {
                let scaling = -pow(1 / midHeight * (x - midHeight), 2) + 1
                let y = scaling * normedAmplitude * height * sin(2.0 * .pi * (x / width) * frequency + phase) + midHeight
                path.addLine(to: CGPoint(x: x, y: y))
            }
        }
        
        waveLayer?.path = path.cgPath
    }
    
    // MARK: - Public Methods
    @objc public func update(with level: Float) {
        amplitude = CGFloat(level)
    }
    
    @objc public func reset() {
        amplitude = idleAmplitude
    }
    
    // MARK: - Lifecycle
    public override func layoutSubviews() {
        super.layoutSubviews()
        waveLayer?.frame = bounds
        updateWavePath()
    }
    
    deinit {
        stopDisplayLink()
    }
}
