//
//  MitsuhaBarView.swift
//  MitsuhaEngine
//
//  Bar-style visualization view component
//

import UIKit

@IBDesignable
public class MitsuhaBarView: UIView {
    
    // MARK: - Properties
    
    @IBInspectable public var barColor: UIColor = .systemBlue {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var numberOfBars: Int = 40 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var barSpacing: CGFloat = 2.0 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    @IBInspectable public var barCornerRadius: CGFloat = 2.0 {
        didSet {
            setNeedsDisplay()
        }
    }
    
    private var barData: [Float] = []
    private var displayLink: CADisplayLink?
    
    // MARK: - Initialization
    
    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }
    
    required public init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }
    
    private func setup() {
        backgroundColor = .clear
    }
    
    // MARK: - Public Methods
    
    public func updateBarData(_ data: [Float]) {
        barData = data
        setNeedsDisplay()
    }
    
    public func startAnimation() {
        guard displayLink == nil else { return }
        displayLink = CADisplayLink(target: self, selector: #selector(animationUpdate))
        displayLink?.add(to: .main, forMode: .common)
    }
    
    public func stopAnimation() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    @objc private func animationUpdate() {
        setNeedsDisplay()
    }
    
    // MARK: - Drawing
    
    public override func draw(_ rect: CGRect) {
        super.draw(rect)
        
        guard let context = UIGraphicsGetCurrentContext() else { return }
        
        context.clear(rect)
        
        let barWidth = (rect.width - CGFloat(numberOfBars - 1) * barSpacing) / CGFloat(numberOfBars)
        
        for i in 0..<numberOfBars {
            let x = CGFloat(i) * (barWidth + barSpacing)
            let dataIndex = min(i * barData.count / numberOfBars, barData.count - 1)
            let barHeight = barData.isEmpty ? 0 : CGFloat(barData[dataIndex]) * rect.height
            let y = rect.height - barHeight
            
            let barRect = CGRect(x: x, y: y, width: barWidth, height: barHeight)
            let path = UIBezierPath(roundedRect: barRect, cornerRadius: barCornerRadius)
            
            context.setFillColor(barColor.cgColor)
            context.addPath(path.cgPath)
            context.fillPath()
        }
    }
}
