//
//  MitsuhaAudioProcessor.swift
//  MitsuhaEngine
//
//  Audio processing and FFT calculations
//

import Foundation
import Accelerate
import AVFoundation

public class MitsuhaAudioProcessor {
    
    // MARK: - Properties
    
    private let fftSize: Int
    private let sampleRate: Double
    private var fftSetup: FFTSetup?
    
    // MARK: - Initialization
    
    public init(fftSize: Int = 1024, sampleRate: Double = 44100.0) {
        self.fftSize = fftSize
        self.sampleRate = sampleRate
        
        let log2n = vDSP_Length(log2(Float(fftSize)))
        self.fftSetup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2))
    }
    
    deinit {
        if let setup = fftSetup {
            vDSP_destroy_fftsetup(setup)
        }
    }
    
    // MARK: - Public Methods
    
    public func processAudioBuffer(_ buffer: AVAudioPCMBuffer) -> [Float] {
        guard let channelData = buffer.floatChannelData else {
            return []
        }
        
        let frameLength = Int(buffer.frameLength)
        let channel = channelData[0]
        
        var processedData = [Float](repeating: 0, count: min(frameLength, fftSize))
        
        for i in 0..<processedData.count {
            processedData[i] = channel[i]
        }
        
        return normalize(processedData)
    }
    
    public func calculateFFT(_ input: [Float]) -> [Float] {
        guard input.count >= fftSize, let setup = fftSetup else {
            return []
        }
        
        var realPart = [Float](repeating: 0, count: fftSize / 2)
        var imaginaryPart = [Float](repeating: 0, count: fftSize / 2)
        
        var splitComplex = DSPSplitComplex(realp: &realPart, imagp: &imaginaryPart)
        
        input.withUnsafeBufferPointer { inputPointer in
            let complexBuffer = UnsafePointer<DSPComplex>(OpaquePointer(inputPointer.baseAddress))
            vDSP_ctoz(complexBuffer!, 2, &splitComplex, 1, vDSP_Length(fftSize / 2))
        }
        
        let log2n = vDSP_Length(log2(Float(fftSize)))
        vDSP_fft_zrip(setup, &splitComplex, 1, log2n, FFTDirection(FFT_FORWARD))
        
        var magnitudes = [Float](repeating: 0, count: fftSize / 2)
        vDSP_zvmags(&splitComplex, 1, &magnitudes, 1, vDSP_Length(fftSize / 2))
        
        return normalize(magnitudes)
    }
    
    // MARK: - Private Methods
    
    private func normalize(_ data: [Float]) -> [Float] {
        guard !data.isEmpty else { return [] }
        
        var normalized = data
        var maxValue: Float = 0
        var minValue: Float = 0
        
        vDSP_maxv(data, 1, &maxValue, vDSP_Length(data.count))
        vDSP_minv(data, 1, &minValue, vDSP_Length(data.count))
        
        let range = maxValue - minValue
        guard range > 0 else { return data }
        
        var negativeMin = -minValue
        vDSP_vsadd(data, 1, &negativeMin, &normalized, 1, vDSP_Length(data.count))
        
        var scale = 1.0 / range
        vDSP_vsmul(normalized, 1, &scale, &normalized, 1, vDSP_Length(data.count))
        
        return normalized
    }
    
    public func smoothData(_ data: [Float], factor: Float = 0.3) -> [Float] {
        guard data.count > 1 else { return data }
        
        var smoothed = [Float](repeating: 0, count: data.count)
        smoothed[0] = data[0]
        
        for i in 1..<data.count {
            smoothed[i] = factor * data[i] + (1 - factor) * smoothed[i - 1]
        }
        
        return smoothed
    }
}
