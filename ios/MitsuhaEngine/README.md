# MitsuhaEngine

MitsuhaEngine es una biblioteca de visualización de audio para iOS que proporciona efectos visuales fluidos y gelatinosos para la reproducción de audio.

## Componentes

### MSHWaveView
Vista de visualización de ondas de audio que muestra ondas sinusoidales animadas basadas en los niveles de audio.

**Propiedades configurables:**
- `numberOfWaves`: Número de ondas a mostrar (default: 5)
- `waveColor`: Color de las ondas (default: .systemBlue)
- `primaryWaveLineWidth`: Ancho de la línea primaria (default: 3.0)
- `frequency`: Frecuencia de las ondas (default: 1.5)
- `amplitude`: Amplitud de las ondas (default: 1.0)

**Métodos:**
- `update(with level: Float)`: Actualiza la visualización con el nivel de audio actual
- `reset()`: Reinicia la visualización al estado idle

### MSHJelloView
Vista de visualización gelatinosa que crea un efecto fluido y viscoso basado en simulación de física.

**Propiedades configurables:**
- `numberOfPoints`: Número de puntos de control (default: 8)
- `waveColor`: Color de la visualización (default: .systemBlue)
- `damping`: Factor de amortiguación (default: 0.8)
- `stiffness`: Rigidez del efecto (default: 0.3)

**Métodos:**
- `update(with level: Float)`: Actualiza la visualización con el nivel de audio actual
- `reset()`: Reinicia la visualización al estado idle

### MSHConfig
Clase singleton para configuración global de MitsuhaEngine.

**Propiedades:**
- `enableVisualization`: Habilitar/deshabilitar visualización
- Configuraciones globales para waves y jello

### MSHAudioProcessor
Procesador de audio que captura y analiza los niveles de audio.

**Métodos:**
- `start()`: Iniciar el procesamiento de audio
- `stop()`: Detener el procesamiento de audio
- `getAudioLevel()`: Obtener el nivel de audio actual (0.0 - 1.0)

## Uso Básico

### En Swift (iOS Native)

```swift
import UIKit

class PlayerViewController: UIViewController {
    let waveView = MSHWaveView(frame: .zero)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configurar la vista de ondas
        waveView.waveColor = .systemPurple
        waveView.numberOfWaves = 7
        view.addSubview(waveView)
        
        // Configurar constraints o frame
        waveView.frame = CGRect(x: 0, y: 0, width: view.bounds.width, height: 200)
        
        // Actualizar con niveles de audio
        // En tu callback de audio:
        waveView.update(with: audioLevel)
    }
}
```

### Con React Native (Expo)

Para usar MitsuhaEngine desde React Native, necesitarás crear un módulo nativo:

1. Crear un módulo de Expo que exponga las vistas
2. Usar `requireNativeViewManager` para cargar las vistas nativas
3. Pasar los niveles de audio desde JavaScript

## Integración con el Proyecto

Los archivos de MitsuhaEngine están ubicados en:
- `ios/MitsuhaEngine/MSHWaveView.swift`
- `ios/MitsuhaEngine/MSHJelloView.swift`
- `ios/MitsuhaEngine/MSHConfig.swift`
- `ios/MitsuhaEngine/MSHAudioProcessor.swift`

Ya están integrados en el proyecto de Xcode `qobuzmobilev2.xcodeproj` y se compilarán automáticamente con el proyecto.

## Requisitos

- iOS 15.1+
- Swift 5.0+
- AVFoundation framework
- Accelerate framework

## Próximos Pasos

Para usar MitsuhaEngine en tu aplicación React Native:

1. Crear un módulo Expo que envuelva MSHWaveView/MSHJelloView
2. Exportar el módulo como un componente React Native
3. Conectar los niveles de audio desde expo-av al módulo nativo
4. Renderizar el componente en tus pantallas de reproducción

## Notas

- MitsuhaEngine usa CADisplayLink para animaciones suaves a 60 FPS
- El audio processor usa AVAudioEngine para captura de audio en tiempo real
- Las visualizaciones se actualizan automáticamente en el main thread
