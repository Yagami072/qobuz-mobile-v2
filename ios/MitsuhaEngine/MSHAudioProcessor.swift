//
//  MSHAudioProcessor.swift
//  MitsuhaEngine
//
//  Audio processing and level detection
//

import AVFoundation
import Accelerate

@objc public class MSHAudioProcessor: NSObject {
    
    // MARK: - Public Properties
    @objc public var audioLevel: Float = 0.0
    
    // MARK: - Private Properties
    private var audioEngine: AVAudioEngine?
    private var isRunning: Bool = false
    
    // MARK: - Singleton
    @objc public static let shared = MSHAudioProcessor()
    
    private override init() {
        super.init()
        setupAudioEngine()
    }
    
    // MARK: - Audio Engine Setup
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        
        guard let engine = audioEngine else { return }
        
        let inputNode = engine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, time in
            self?.processAudioBuffer(buffer)
        }
    }
    
    // MARK: - Audio Processing
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData else { return }
        
        let channelDataValue = channelData.pointee
        let channelDataArray = Array(UnsafeBufferPointer(start: channelDataValue, count: Int(buffer.frameLength)))
        
        // Calculate RMS (Root Mean Square) for audio level
        let rms = sqrt(channelDataArray.map { $0 * $0 }.reduce(0, +) / Float(channelDataArray.count))
        
        // Normalize to 0.0 - 1.0 range
        let normalizedLevel = min(rms * 10.0, 1.0)
        
        DispatchQueue.main.async {
            self.audioLevel = normalizedLevel
        }
    }
    
    // MARK: - Public Methods
    @objc public func start() {
        guard let engine = audioEngine, !isRunning else { return }
        
        do {
            try engine.start()
            isRunning = true
        } catch {
            print("Failed to start audio engine: \(error.localizedDescription)")
        }
    }
    
    @objc public func stop() {
        guard let engine = audioEngine, isRunning else { return }
        
        engine.stop()
        isRunning = false
    }
    
    @objc public func getAudioLevel() -> Float {
        return audioLevel
    }
    
    deinit {
        stop()
    }
}
