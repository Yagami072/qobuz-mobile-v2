//
//  MitsuhaWaveView.swift
//  MitsuhaEngine
//
//  Wave visualization view component
//

import UIKit

@IBDesignable
public class MitsuhaWaveView: UIView {
    
    // MARK: - Properties
    
    @IBInspectable public var waveColor: UIColor = .systemBlue {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var numberOfWaves: Int = 3 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var waveAmplitude: CGFloat = 40.0 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var wavePrimaryWidth: CGFloat = 2.0 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var waveSecondaryWidth: CGFloat = 1.0 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    private var waveData: [Float] = []
    private var engine: MitsuhaEngine
    
    // MARK: - Initialization
    
    public override init(frame: CGRect) {
        self.engine = MitsuhaEngine()
        super.init(frame: frame)
        setup()
    }
    
    required public init?(coder: NSCoder) {
        self.engine = MitsuhaEngine()
        super.init(coder: coder)
        setup()
    }
    
    private func setup() {
        backgroundColor = .clear
        engine.waveColor = waveColor
        engine.numberOfWaves = numberOfWaves
        engine.waveAmplitude = waveAmplitude
        engine.wavePrimaryWidth = wavePrimaryWidth
        engine.waveSecondaryWidth = waveSecondaryWidth
    }
    
    // MARK: - Public Methods
    
    public func updateWaveData(_ data: [Float]) {
        waveData = data
        engine.updateAudioData(data)
        setNeedsDisplay()
    }
    
    public func startAnimation() {
        engine.start()
    }
    
    public func stopAnimation() {
        engine.stop()
    }
    
    // MARK: - Drawing
    
    public override func draw(_ rect: CGRect) {
        super.draw(rect)
        
        guard let context = UIGraphicsGetCurrentContext() else { return }
        
        context.clear(rect)
        
        // Draw waves
        for i in 0..<numberOfWaves {
            drawWave(in: context, rect: rect, index: i)
        }
    }
    
    private func drawWave(in context: CGContext, rect: CGRect, index: Int) {
        let path = UIBezierPath()
        let midHeight = rect.height / 2
        let amplitude = waveAmplitude / CGFloat(index + 1)
        
        path.move(to: CGPoint(x: 0, y: midHeight))
        
        let points = 100
        for i in 0...points {
            let x = CGFloat(i) * rect.width / CGFloat(points)
            let waveIndex = min(i * waveData.count / points, waveData.count - 1)
            let dataPoint = waveData.isEmpty ? 0 : CGFloat(waveData[waveIndex])
            let y = midHeight + (dataPoint * amplitude)
            path.addLine(to: CGPoint(x: x, y: y))
        }
        
        context.setStrokeColor(waveColor.cgColor)
        context.setLineWidth(index == 0 ? wavePrimaryWidth : waveSecondaryWidth)
        context.addPath(path.cgPath)
        context.strokePath()
    }
}
