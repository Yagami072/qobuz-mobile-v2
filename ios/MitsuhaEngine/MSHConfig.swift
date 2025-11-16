//
//  MSHConfig.swift
//  MitsuhaEngine
//
//  Configuration for audio visualization
//

import UIKit

@objc public class MSHConfig: NSObject {
    
    // MARK: - Singleton
    @objc public static let shared = MSHConfig()
    
    // MARK: - Wave Configuration
    @objc public var numberOfWaves: Int = 5
    @objc public var waveColor: UIColor = .systemBlue
    @objc public var primaryWaveLineWidth: CGFloat = 3.0
    @objc public var secondaryWaveLineWidth: CGFloat = 1.0
    @objc public var idleAmplitude: CGFloat = 0.01
    @objc public var frequency: CGFloat = 1.5
    @objc public var density: CGFloat = 5.0
    @objc public var phaseShift: CGFloat = -0.15
    
    // MARK: - Jello Configuration
    @objc public var numberOfJelloPoints: Int = 8
    @objc public var damping: CGFloat = 0.8
    @objc public var stiffness: CGFloat = 0.3
    
    // MARK: - General
    @objc public var enableVisualization: Bool = true
    
    private override init() {
        super.init()
    }
}
