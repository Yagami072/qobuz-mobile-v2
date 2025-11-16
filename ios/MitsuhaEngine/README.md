# MitsuhaEngine Integration

## Overview

MitsuhaEngine es un motor de visualización de audio para iOS que proporciona componentes para visualizar ondas de audio en tiempo real.

## Archivos Incluidos

### `MitsuhaEngine.swift`
Motor principal de visualización que procesa datos de audio y gestiona la actualización de visualizaciones.

**Características:**
- Procesamiento de buffers de audio
- Cálculo de FFT (Fast Fourier Transform)
- Gestión de display link para animaciones suaves
- Colores y amplitudes configurables

### `MitsuhaWaveView.swift`
Componente de visualización de onda estilo forma de onda.

**Propiedades IBInspectable:**
- `waveColor`: Color de la onda
- `numberOfWaves`: Número de ondas simultáneas
- `waveAmplitude`: Amplitud de la onda
- `wavePrimaryWidth`: Ancho de la onda principal
- `waveSecondaryWidth`: Ancho de las ondas secundarias

### `MitsuhaAudioProcessor.swift`
Procesador de audio especializado que realiza análisis FFT y normalización de datos de audio.

**Capacidades:**
- Procesamiento de buffers AVAudioPCMBuffer
- Cálculo de FFT con vDSP/Accelerate
- Normalización automática de datos
- Suavizado de datos para visualizaciones más fluidas

### `MitsuhaBarView.swift`
Componente de visualización estilo barra (ecualizador).

**Propiedades IBInspectable:**
- `barColor`: Color de las barras
- `numberOfBars`: Número de barras
- `barSpacing`: Espaciado entre barras
- `barCornerRadius`: Radio de esquina de las barras

## Integración en Xcode

Los archivos han sido agregados al proyecto Xcode en la carpeta `ios/MitsuhaEngine/` y se encuentran correctamente referenciados en el archivo `project.pbxproj`.

### Estructura del Proyecto

```
ios/
├── MitsuhaEngine/
│   ├── MitsuhaEngine.swift
│   ├── MitsuhaWaveView.swift
│   ├── MitsuhaAudioProcessor.swift
│   └── MitsuhaBarView.swift
└── qobuzmobilev2.xcodeproj/
    └── project.pbxproj (actualizado con referencias)
```

## Uso Básico

### Ejemplo en Swift

```swift
import UIKit

class PlayerViewController: UIViewController {
    private let waveView = MitsuhaWaveView(frame: .zero)
    private let audioProcessor = MitsuhaAudioProcessor()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configurar la vista de onda
        waveView.frame = CGRect(x: 0, y: 100, width: view.bounds.width, height: 200)
        waveView.waveColor = .systemBlue
        waveView.numberOfWaves = 3
        waveView.waveAmplitude = 50
        
        view.addSubview(waveView)
        waveView.startAnimation()
    }
    
    func updateVisualization(with audioBuffer: AVAudioPCMBuffer) {
        let processedData = audioProcessor.processAudioBuffer(audioBuffer)
        waveView.updateWaveData(processedData)
    }
}
```

### Ejemplo con Vista de Barras

```swift
let barView = MitsuhaBarView(frame: CGRect(x: 0, y: 0, width: 300, height: 100))
barView.barColor = .systemGreen
barView.numberOfBars = 40
barView.barSpacing = 2

// Actualizar con datos de audio
let audioData: [Float] = [0.1, 0.3, 0.5, 0.7, ...]
barView.updateBarData(audioData)
barView.startAnimation()
```

## Integración con React Native (Futuro)

Para usar MitsuhaEngine desde React Native, será necesario crear un módulo nativo bridge:

1. Crear `RCTMitsuhaEngineView.swift` que exporte el componente
2. Crear `RCTMitsuhaEngineViewManager.swift` para gestionar el componente
3. Exponer propiedades y métodos a JavaScript

## Frameworks Requeridos

MitsuhaEngine utiliza los siguientes frameworks de iOS:
- `UIKit` - Para componentes de UI
- `Accelerate` - Para cálculos FFT optimizados
- `AVFoundation` - Para procesamiento de audio

Estos frameworks ya están incluidos en el SDK de iOS y no requieren instalación adicional.

## Rendimiento

MitsuhaEngine utiliza:
- **vDSP** del framework Accelerate para cálculos FFT optimizados
- **CADisplayLink** para animaciones sincronizadas con la tasa de refresco de la pantalla
- **Core Graphics** para renderizado eficiente de formas

## Notas de Implementación

- Los archivos están escritos en Swift y son compatibles con iOS 13+
- La implementación es thread-safe para procesamiento de audio en background
- El motor soporta múltiples vistas de visualización simultáneas
- Las animaciones se pausan automáticamente cuando la app está en background

## Próximos Pasos

1. ✅ Crear archivos de MitsuhaEngine
2. ✅ Integrar en proyecto Xcode
3. ⬜ Crear bridge para React Native
4. ⬜ Implementar componente React Native
5. ⬜ Integrar con reproductor de audio existente
6. ⬜ Añadir tests unitarios

## Licencia

Este código es parte del proyecto qobuz-mobile-v2 y está sujeto a la misma licencia del proyecto principal.
