import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const FeedVideoPlayer = ({ sourceUri, isViewable, style }) => {
    const videoRef = useRef(null);
    const [playbackStatus, setPlaybackStatus] = useState(null);
    const [isMuted, setIsMuted] = useState(true); // Başlangıçta sessiz

    const isPlaying = playbackStatus?.isPlaying;
    const isLoading = playbackStatus?.isBuffering && !isPlaying; // Yükleniyor ama oynamıyor

    // Görünürlük değiştiğinde oynat/duraklat
    useEffect(() => {
        if (!videoRef.current) return;

        if (isViewable) {
            console.log(`Video ${sourceUri} viewable, playing.`);
            videoRef.current.playAsync().catch(e => console.warn("Play error:", e));
        } else {
            console.log(`Video ${sourceUri} not viewable, pausing.`);
            videoRef.current.pauseAsync().catch(e => console.warn("Pause error:", e));
        }
    }, [isViewable]);

    // Oynatma durumu güncellemelerini dinle
    const onPlaybackStatusUpdate = (status) => {
        setPlaybackStatus(status);
        if (status.error) {
            console.error(`Video Playback Error (${sourceUri}):`, status.error);
        }
    };

    // Sesi aç/kapat
    const toggleMute = () => {
        setIsMuted(!isMuted);
        videoRef.current?.setIsMutedAsync(!isMuted);
    };

    return (
        <View style={[styles.container, style]}>
            <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: sourceUri }}
                useNativeControls={false} // Özel kontrol kullanacağız (veya başlangıçta true)
                resizeMode={ResizeMode.COVER}
                isLooping={true} // Akışta genellikle döngü istenir
                isMuted={isMuted} // State'e bağlandı
                shouldPlay={false} // Oynatma `useEffect` ile kontrol edilecek
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                onError={(e) => console.error(`Video Load Error (${sourceUri}):`, e)}
            />

            {/* Yükleme Göstergesi */}
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}

            {/* Sessize Alma Butonu */}
            <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-medium'}
                    size={24}
                    color="#fff"
                />
            </TouchableOpacity>

            {/* İsteğe bağlı: Oynat/Duraklat butonu (dokunmayla) */}
            {/* <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={togglePlayPause}>
                {!isPlaying && !isLoading && (
                     <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
                )}
            </TouchableOpacity> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Video arka planı
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    muteButton: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20,
    },
    // Oynat/Duraklat overlay'i için (isteğe bağlı)
    // overlay: {
    //     ...StyleSheet.absoluteFillObject,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
});

export default React.memo(FeedVideoPlayer); // Performans için memoize et
