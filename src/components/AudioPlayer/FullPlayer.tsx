import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  FlatList,
  Alert,
  ActivityIndicator,
  Easing,
  InteractionManager,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Audio } from 'expo-av';
import { useSelector, useDispatch } from 'react-redux';
import type { Track } from '../../services/qobuz/types';
import type { RootState } from '../../store/store';
import { addToFavorites, removeFromFavorites } from '../../store/slices/favoritesSlice';
import { createPlaylist, addTrackToPlaylist } from '../../store/slices/librarySlice';
import MitsuhaVisualizer from '../MitsuhaVisualizer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const QUEUE_PANEL_HEIGHT = SCREEN_HEIGHT * 0.6;

interface FullPlayerProps {
  track: Track;
  isPlaying: boolean;
  sound: Audio.Sound | null;
  onClose: () => void;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  queue?: Track[];
  onQueueUpdate?: (queue: Track[]) => void;
  onTrackSelect?: (track: Track) => void;
  visible?: boolean; // Nueva prop para controlar visibilidad
  isLocalFile?: boolean; // Para saber si es archivo local o streaming
  isShuffleEnabled?: boolean;
  onShuffleToggle?: () => void;
  repeatMode?: 'off' | 'all' | 'one';
  onRepeatToggle?: () => void;
}

const FullPlayer: React.FC<FullPlayerProps> = ({
  track,
  isPlaying,
  sound,
  onClose,
  onPlayPause,
  onNext,
  onPrevious,
  queue = [],
  onQueueUpdate,
  onTrackSelect,
  visible = true,
  isLocalFile = false,
  isShuffleEnabled = false,
  onShuffleToggle,
  repeatMode = 'off',
  onRepeatToggle,
}) => {
  const dispatch = useDispatch();
  const favoriteTracks = useSelector((state: RootState) => state.favorites.tracks);
  const playlists = useSelector((state: RootState) => state.library.playlists);
  
  // Verificar si el track actual está en favoritos
  const isFavorite = favoriteTracks.some(fav => fav.id === track.id);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  // Usar refs para valores que cambian frecuentemente y no necesitan re-render
  const lastPositionUpdate = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const albumArtScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const queueSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const playlistModalOpacity = useRef(new Animated.Value(0)).current;
  const progressBarWidth = useRef(0);
  
  // Referencias para controlar animaciones de loop
  const albumArtAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const glowAnimation = useRef<Animated.CompositeAnimation | null>(null);
  
  // Flag para pausar actualizaciones durante animaciones
  const isAnimating = useRef(false);

  // Animar entrada/salida cuando cambia la visibilidad
  useEffect(() => {
    if (visible) {
      // Animar entrada
      isAnimating.current = false;
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // DETENER TODAS LAS ANIMACIONES DE LOOP INMEDIATAMENTE
      isAnimating.current = true;
      albumArtAnimation.current?.stop();
      glowAnimation.current?.stop();
      albumArtScale.setValue(1);
      glowAnim.setValue(0);
      
      // Resetear a posición inicial cuando no es visible
      slideAnim.setValue(SCREEN_HEIGHT);
      opacityAnim.setValue(0);
      translateY.setValue(0);
    }
  }, [visible]);

  // Pan responder para swipe down para cerrar
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo activar si el movimiento es principalmente vertical hacia abajo
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          // Marcar que estamos animando
          isAnimating.current = true;
          
          // Detener animaciones de loop
          albumArtAnimation.current?.stop();
          glowAnimation.current?.stop();
          
          // Llamar onClose primero
          onClose();
          
          // Si desliza más de 150px o con velocidad rápida, cerrar con animación
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: SCREEN_HEIGHT,
              friction: 10,
              tension: 65,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Reactivar actualizaciones después de la animación
            InteractionManager.runAfterInteractions(() => {
              isAnimating.current = false;
            });
          });
        } else {
          // Si no, regresar a posición original
          Animated.spring(translateY, {
            toValue: 0,
            friction: 9,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Actualizar posición y duración del audio usando el callback nativo de expo-av
  useEffect(() => {
    if (!sound) return;

    // Usar el callback nativo en lugar de polling con setInterval
    // Esto es MUCHO más eficiente y no bloquea el hilo de JS
    const onPlaybackStatusUpdate = (status: any) => {
      // No actualizar si estamos en medio de una animación o no es visible
      if (isAnimating.current || !visible) return;
      
      if (status.isLoaded && !isSeeking) {
        const currentPosition = status.positionMillis || 0;
        const currentDuration = status.durationMillis || 0;
        
        // Throttle: solo actualizar estado cada 500ms para reducir re-renders
        const now = Date.now();
        if (now - lastPositionUpdate.current < 500) {
          // Actualizar solo la barra de progreso (no causa re-render)
          const progress = currentDuration 
            ? currentPosition / currentDuration 
            : 0;
          progressAnim.setValue(progress);
          return;
        }
        
        lastPositionUpdate.current = now;
        
        // Usar requestAnimationFrame para suavizar las actualizaciones del estado
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        
        animationFrameId.current = requestAnimationFrame(() => {
          setPosition(currentPosition);
          setDuration(currentDuration);
          setIsBuffering(status.isBuffering || false);
          
          // Actualizar la barra de progreso
          const progress = currentDuration 
            ? currentPosition / currentDuration 
            : 0;
          progressAnim.setValue(progress);
        });
      }
    };

    // Establecer el callback nativo
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    // Limpiar el callback al desmontar
    return () => {
      sound.setOnPlaybackStatusUpdate(null);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [sound, visible, isSeeking]);

  // Animaciones de loop solo cuando está reproduciendo
  useEffect(() => {
    // Solo iniciar animaciones si está visible y reproduciendo
    if (isPlaying && visible && !isAnimating.current) {
      
      // Animación MUY SUTIL del álbum art - más lenta y menos intensa
      albumArtAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(albumArtScale, {
            toValue: 1.01,  // Reducido de 1.02 a 1.01
            duration: 3000,  // Aumentado de 2000 a 3000ms
            useNativeDriver: true,
          }),
          Animated.timing(albumArtScale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
      albumArtAnimation.current.start();

      // Animación de glow también más lenta
      glowAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2500,  // Aumentado de 1500 a 2500ms
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.current.start();
    } else {
      // Detener animaciones cuando no está reproduciendo
      albumArtAnimation.current?.stop();
      glowAnimation.current?.stop();
      albumArtScale.setValue(1);
      glowAnim.setValue(0);
    }

    return () => {
      // Detener animaciones al desmontar
      albumArtAnimation.current?.stop();
      glowAnimation.current?.stop();
    };
  }, [isPlaying, visible]); // Agregar visible a las dependencias

  // Formatear tiempo en mm:ss
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Manejar seek en la barra de progreso
  const handleSeek = async (progressValue: number) => {
    if (sound && duration > 0) {
      try {
        const seekPosition = progressValue * duration;
        await sound.setPositionAsync(seekPosition);
        setPosition(seekPosition);
      } catch (error) {
        console.error('[FullPlayer] Error seeking:', error);
      }
    }
  };

  // Adelantar 10 segundos
  const handleForward = async () => {
    if (sound && duration > 0) {
      try {
        const newPosition = Math.min(position + 10000, duration);
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      } catch (error) {
        console.error('[FullPlayer] Error forwarding:', error);
      }
    }
  };

  // Atrasar 10 segundos
  const handleRewind = async () => {
    if (sound) {
      try {
        const newPosition = Math.max(position - 10000, 0);
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      } catch (error) {
        console.error('[FullPlayer] Error rewinding:', error);
      }
    }
  };

  // Cerrar con animación
  const handleCloseWithAnimation = () => {
    // Marcar que estamos animando
    isAnimating.current = true;
    
    // Detener animaciones de loop para mejor rendimiento
    albumArtAnimation.current?.stop();
    glowAnimation.current?.stop();
    
    // Llamar onClose inmediatamente para que el SearchScreen prepare el mini player
    onClose();
    
    // Ejecutar la animación de salida
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        friction: 10,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reactivar actualizaciones después de la animación
      InteractionManager.runAfterInteractions(() => {
        isAnimating.current = false;
      });
    });
  };

  // Abrir/Cerrar cola de reproducción
  const toggleQueue = () => {
    const toValue = showQueue ? SCREEN_HEIGHT : 0;
    
    Animated.spring(queueSlideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
    
    setShowQueue(!showQueue);
  };

  // Eliminar canción de la cola
  const handleRemoveFromQueue = (trackId: number) => {
    if (onQueueUpdate) {
      const updatedQueue = queue.filter(t => t.id !== trackId);
      onQueueUpdate(updatedQueue);
      
      Alert.alert(
        'Eliminado',
        'Canción eliminada de la cola',
        [{ text: 'OK' }]
      );
    }
  };

  // Limpiar toda la cola
  const handleClearQueue = () => {
    Alert.alert(
      'Limpiar cola',
      '¿Estás seguro de que quieres eliminar todas las canciones de la cola?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            if (onQueueUpdate) {
              onQueueUpdate([]);
              setShowQueue(false);
            }
          },
        },
      ]
    );
  };

  // Toggle favoritos
  const handleToggleFavorite = () => {
    if (isFavorite) {
      dispatch(removeFromFavorites(track.id) as any);
      console.log('[FullPlayer] ❤️ Removed from favorites:', track.title);
    } else {
      // Determinar source: si isLocalFile es true Y el track tiene localUri, es 'local', sino 'streaming'
      const hasLocalUri = !!(track as any).localUri || !!(track as any).local_file_uri;
      const source = isLocalFile && hasLocalUri ? 'local' : 'streaming';
      
      console.log('[FullPlayer] 📊 Adding to favorites - Track info:', {
        title: track.title,
        isLocalFile,
        hasLocalUri,
        localUri: (track as any).localUri || (track as any).local_file_uri || 'NOT FOUND',
        decidedSource: source,
      });
      
      if (isLocalFile && !hasLocalUri) {
        console.warn('[FullPlayer] ⚠️ Track marked as local but no localUri found, saving as streaming');
        console.warn('[FullPlayer] 💡 Tip: Make sure to include localUri when setting currentTrack for local files');
      }
      
      dispatch(addToFavorites(track, source) as any);
      console.log(`[FullPlayer] ❤️ Added to favorites as ${source}:`, track.title);
    }
  };

  // Manejar playlist
  const handleOpenPlaylistModal = () => {
    setShowPlaylistModal(true);
  };

  const handleClosePlaylistModal = () => {
    setShowPlaylistModal(false);
    setNewPlaylistName('');
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      dispatch(createPlaylist({ name: newPlaylistName.trim() }));
      setNewPlaylistName('');
      Alert.alert('Éxito', `Playlist "${newPlaylistName.trim()}" creada`);
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    dispatch(addTrackToPlaylist({ playlistId, track }));
    const playlist = playlists.find(p => p.id === playlistId);
    Alert.alert('Éxito', `Añadido a "${playlist?.name}"`);
    handleClosePlaylistModal();
  };

  // Manejar errores de reproducción
  const handlePlaybackError = (errorMsg: string) => {
    setError(errorMsg);
    setIsBuffering(false);
    
    Alert.alert(
      'Error de reproducción',
      errorMsg,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reintentar',
          onPress: () => {
            setError(null);
            onPlayPause();
          },
        },
      ]
    );
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: Animated.add(slideAnim, translateY) }
          ],
        },
      ]}
    >
      <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.95)', 'rgba(29,185,84,0.1)', 'rgba(0,0,0,0.98)']}
          style={styles.gradient}
        >
          {/* Header con botón de cerrar - área deslizable */}
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.dragIndicator} />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleCloseWithAnimation}
              activeOpacity={0.7}
            >
              <BlurView intensity={30} tint="dark" style={styles.closeButtonBlur}>
                <Icon name="keyboard-arrow-down" size={32} color="rgba(255,255,255,0.8)" />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Album Art con efecto glow - también deslizable */}
          <View style={styles.albumArtContainer} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  opacity: glowOpacity,
                },
              ]}
            />
            <Animated.View
              style={{
                transform: [{ scale: albumArtScale }],
              }}
            >
              <Image
                source={{
                  uri: track.album?.image?.large || track.album?.image?.small || 'https://via.placeholder.com/300',
                }}
                style={styles.albumArt}
              />
            </Animated.View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {track.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {track.performer?.name || 'Unknown Artist'}
            </Text>
            {track.album?.title && (
              <Text style={styles.trackAlbum} numberOfLines={1}>
                {track.album.title}
              </Text>
            )}
          </View>

          {/* Mitsuha Visualizer */}
          {visible && (
            <View style={styles.visualizerContainer}>
              <MitsuhaVisualizer
                style={styles.visualizer}
                barColor="#1DB954"
                sensitivity={1.8}
                smoothness={0.25}
                waveStyle="mitsuha"
              />
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Slider
              style={styles.slider}
              value={isSeeking ? position : position}
              minimumValue={0}
              maximumValue={duration || 1}
              minimumTrackTintColor="#1DB954"
              maximumTrackTintColor="rgba(255,255,255,0.15)"
              thumbTintColor="#fff"
              step={1000} // Actualizar cada segundo para reducir re-renders
              onSlidingStart={() => setIsSeeking(true)}
              onSlidingComplete={(value) => {
                handleSeek(value / (duration || 1));
                setIsSeeking(false);
              }}
              onValueChange={(value) => {
                if (isSeeking) {
                  setPosition(value);
                }
              }}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, !onPrevious && styles.controlButtonDisabled]}
              onPress={onPrevious}
              disabled={!onPrevious}
              activeOpacity={0.7}
            >
              <BlurView 
                intensity={onPrevious ? 40 : 20} 
                tint="dark" 
                style={styles.controlButtonBlur}
              >
                <Icon name="skip-previous" size={40} color={onPrevious ? "#fff" : "rgba(255,255,255,0.3)"} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryControlButton}
              onPress={handleRewind}
              activeOpacity={0.7}
            >
              <BlurView intensity={30} tint="dark" style={styles.secondaryControlBlur}>
                <Icon name="replay-10" size={32} color="rgba(255,255,255,0.8)" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={onPlayPause} activeOpacity={0.8}>
              <BlurView intensity={50} tint="light" style={styles.playButtonBlur}>
                <LinearGradient
                  colors={['#1DB954', '#14853E']}
                  style={styles.playButtonGradient}
                >
                  {isBuffering ? (
                    <Icon name="refresh" size={48} color="#fff" />
                  ) : (
                    <Icon
                      name={isPlaying ? 'pause' : 'play-arrow'}
                      size={48}
                      color="#fff"
                    />
                  )}
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryControlButton}
              onPress={handleForward}
              activeOpacity={0.7}
            >
              <BlurView intensity={30} tint="dark" style={styles.secondaryControlBlur}>
                <Icon name="forward-10" size={32} color="rgba(255,255,255,0.8)" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, !onNext && styles.controlButtonDisabled]}
              onPress={onNext}
              disabled={!onNext}
              activeOpacity={0.7}
            >
              <BlurView 
                intensity={onNext ? 40 : 20} 
                tint="dark" 
                style={styles.controlButtonBlur}
              >
                <Icon name="skip-next" size={40} color={onNext ? "#fff" : "rgba(255,255,255,0.3)"} />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Additional Controls */}
          <View style={styles.additionalControls}>
            <TouchableOpacity 
              style={[styles.iconButton, isShuffleEnabled && styles.iconButtonActive]} 
              onPress={onShuffleToggle}
              activeOpacity={0.7}
              disabled={!onShuffleToggle}
            >
              <BlurView 
                intensity={isShuffleEnabled ? 35 : 25} 
                tint="dark" 
                style={styles.iconButtonBlur}
              >
                <Icon 
                  name="shuffle" 
                  size={24} 
                  color={isShuffleEnabled ? "#1DB954" : "rgba(255,255,255,0.6)"} 
                />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.iconButton, repeatMode !== 'off' && styles.iconButtonActive]} 
              onPress={onRepeatToggle}
              activeOpacity={0.7}
              disabled={!onRepeatToggle}
            >
              <BlurView 
                intensity={repeatMode !== 'off' ? 35 : 25} 
                tint="dark" 
                style={styles.iconButtonBlur}
              >
                <Icon 
                  name={repeatMode === 'one' ? 'repeat-one' : 'repeat'} 
                  size={24} 
                  color={repeatMode !== 'off' ? "#1DB954" : "rgba(255,255,255,0.6)"} 
                />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.iconButton, queue.length > 0 && styles.iconButtonActive]} 
              onPress={toggleQueue}
              activeOpacity={0.7}
            >
              <BlurView 
                intensity={queue.length > 0 ? 35 : 25} 
                tint="dark" 
                style={styles.iconButtonBlur}
              >
                <Icon 
                  name="queue-music" 
                  size={24} 
                  color={queue.length > 0 ? "#1DB954" : "rgba(255,255,255,0.6)"} 
                />
                {queue.length > 0 && (
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueBadgeText}>{queue.length}</Text>
                  </View>
                )}
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.7}
              onPress={handleToggleFavorite}
            >
              <BlurView intensity={25} tint="dark" style={styles.iconButtonBlur}>
                <Icon 
                  name={isFavorite ? "favorite" : "favorite-border"} 
                  size={24} 
                  color={isFavorite ? "#1DB954" : "rgba(255,255,255,0.6)"} 
                />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.7}
              onPress={handleOpenPlaylistModal}
            >
              <BlurView intensity={25} tint="dark" style={styles.iconButtonBlur}>
                <Icon 
                  name="playlist-add" 
                  size={24} 
                  color="rgba(255,255,255,0.6)" 
                />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </LinearGradient>
      </BlurView>

      {/* Queue Panel */}
      <Animated.View
        style={[
          styles.queuePanel,
          {
            transform: [{ translateY: queueSlideAnim }],
          },
        ]}
      >
        <BlurView intensity={95} tint="dark" style={styles.queueBlur}>
          <View style={styles.queueHeader}>
            <View style={styles.queueHeaderLeft}>
              <Icon name="queue-music" size={24} color="#1DB954" />
              <Text style={styles.queueTitle}>
                Cola de reproducción ({queue.length})
              </Text>
            </View>
            <View style={styles.queueHeaderRight}>
              {queue.length > 0 && (
                <TouchableOpacity 
                  onPress={handleClearQueue}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <BlurView intensity={30} tint="dark" style={styles.clearButtonBlur}>
                    <Text style={styles.clearButtonText}>Limpiar</Text>
                  </BlurView>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={toggleQueue} 
                style={styles.queueCloseButton}
                activeOpacity={0.7}
              >
                <BlurView intensity={25} tint="dark" style={styles.queueCloseBlur}>
                  <Icon name="close" size={24} color="rgba(255,255,255,0.7)" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.queueDivider} />

          {queue.length === 0 ? (
            <View style={styles.emptyQueue}>
              <Icon name="music-note" size={64} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyQueueText}>No hay canciones en la cola</Text>
              <Text style={styles.emptyQueueSubtext}>
                Las canciones que agregues aparecerán aquí
              </Text>
            </View>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.queueItem,
                    item.id === track.id && styles.queueItemActive,
                  ]}
                  onPress={() => onTrackSelect && onTrackSelect(item)}
                  activeOpacity={0.7}
                >
                  <BlurView 
                    intensity={item.id === track.id ? 35 : 20} 
                    tint="dark" 
                    style={styles.queueItemBlur}
                  >
                    <View style={styles.queueItemLeft}>
                      <Text style={styles.queueItemNumber}>{index + 1}</Text>
                      <Image
                        source={{
                          uri: item.album?.image?.thumbnail || item.album?.image?.small,
                        }}
                        style={styles.queueItemImage}
                      />
                      <View style={styles.queueItemInfo}>
                        <Text
                          style={[
                            styles.queueItemTitle,
                            item.id === track.id && styles.queueItemTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.queueItemArtist} numberOfLines={1}>
                          {item.performer?.name || 'Artista Desconocido'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.queueItemRemove}
                      onPress={() => handleRemoveFromQueue(item.id)}
                    >
                      <BlurView intensity={25} tint="dark" style={styles.queueItemRemoveBlur}>
                        <Icon name="close" size={20} color="rgba(255,255,255,0.5)" />
                      </BlurView>
                    </TouchableOpacity>
                  </BlurView>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.queueList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </BlurView>
      </Animated.View>

      {/* Playlist Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePlaylistModal}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Añadir a Playlist</Text>
                <TouchableOpacity onPress={handleClosePlaylistModal}>
                  <Icon name="close" size={24} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              {/* Create New Playlist */}
              <View style={styles.createPlaylistSection}>
                <TextInput
                  style={styles.playlistInput}
                  placeholder="Nombre de nueva playlist"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  onSubmitEditing={handleCreatePlaylist}
                />
                <TouchableOpacity
                  style={[styles.createButton, !newPlaylistName.trim() && styles.createButtonDisabled]}
                  onPress={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                >
                  <LinearGradient
                    colors={newPlaylistName.trim() ? ['#1ed760', '#1DB954'] : ['#333', '#222']}
                    style={styles.createButtonGradient}
                  >
                    <Icon name="add" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Crear</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              {playlists.length > 0 && <View style={styles.modalDivider} />}

              {/* Playlists List */}
              <ScrollView style={styles.playlistsList} showsVerticalScrollIndicator={false}>
                {playlists.length === 0 ? (
                  <View style={styles.emptyPlaylists}>
                    <Icon name="playlist-add" size={48} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyPlaylistsText}>No tienes playlists</Text>
                    <Text style={styles.emptyPlaylistsSubtext}>
                      Crea una nueva playlist arriba
                    </Text>
                  </View>
                ) : (
                  playlists.map((playlist) => (
                    <TouchableOpacity
                      key={playlist.id}
                      style={styles.playlistItem}
                      onPress={() => handleAddToPlaylist(playlist.id)}
                      activeOpacity={0.7}
                    >
                      <BlurView intensity={20} tint="dark" style={styles.playlistItemBlur}>
                        <View style={styles.playlistItemLeft}>
                          <Icon name="queue-music" size={24} color="#1DB954" />
                          <View style={styles.playlistItemInfo}>
                            <Text style={styles.playlistItemName} numberOfLines={1}>
                              {playlist.name}
                            </Text>
                            <Text style={styles.playlistItemCount}>
                              {playlist.tracks?.length || 0} {(playlist.tracks?.length || 0) === 1 ? 'canción' : 'canciones'}
                            </Text>
                          </View>
                        </View>
                        <Icon name="add" size={24} color="rgba(255,255,255,0.6)" />
                      </BlurView>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </BlurView>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 2000,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 10,
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  albumArt: {
    width: 300,
    height: 300,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  trackTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackAlbum: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  visualizerContainer: {
    width: '100%',
    height: 80,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  visualizer: {
    width: '100%',
    height: '100%',
  },
  progressContainer: {
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  controlButtonBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  secondaryControlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  secondaryControlBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  playButtonBlur: {
    flex: 1,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
  },
  iconButtonBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderRadius: 22,
  },
  queueBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1DB954',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  queueBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    flex: 1,
  },
  queuePanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: QUEUE_PANEL_HEIGHT,
    backgroundColor: 'transparent',
  },
  queueBlur: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  queueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  queueHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  clearButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  clearButtonBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: '600',
  },
  queueCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  queueCloseBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  queueDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  emptyQueue: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyQueueText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyQueueSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  queueList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  queueItem: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  queueItemBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  queueItemActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  queueItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    width: 24,
    textAlign: 'center',
  },
  queueItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  queueItemTitleActive: {
    color: '#1DB954',
  },
  queueItemArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  queueItemRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  queueItemRemoveBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Playlist Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalBlur: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  createPlaylistSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playlistInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  playlistsList: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  emptyPlaylists: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPlaylistsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
  emptyPlaylistsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    textAlign: 'center',
  },
  playlistItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playlistItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  playlistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  playlistItemInfo: {
    flex: 1,
  },
  playlistItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  playlistItemCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default FullPlayer;
