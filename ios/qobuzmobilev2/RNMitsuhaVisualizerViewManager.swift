import Foundation
import UIKit

@objc(RNMitsuhaVisualizerViewManager)
class RNMitsuhaVisualizerViewManager: RCTViewManager {
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func view() -> UIView! {
    return RNMitsuhaVisualizerView()
  }
}
