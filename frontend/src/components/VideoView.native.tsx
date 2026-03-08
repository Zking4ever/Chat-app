import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoViewProps {
    localStream: any;
    remoteStream: any;
    isCameraOff: boolean;
    localVideoRef?: any;
    remoteVideoRef?: any;
    webStyles?: any;
}

/**
 * Native-specific VideoView (safe for Expo Go)
 */
export const VideoView = ({
    localStream,
    remoteStream,
    isCameraOff,
}: VideoViewProps) => {
    // Dynamic import to prevent crash in Expo Go where native module is missing
    let RTCView: any = null;
    try {
        RTCView = require('react-native-webrtc').RTCView;
    } catch (e) {
        // Fallback handled below
    }

    const renderVideo = (stream: any, style: any, isLocal: boolean = false) => {
        if (!RTCView) {
            return (
                <View style={[style, styles.cameraOffPlaceholder]}>
                    <Ionicons name="alert-circle-outline" size={24} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10, marginTop: 4, textAlign: 'center' }}>
                        Dev Build Required
                    </Text>
                </View>
            );
        }
        return (
            <RTCView
                streamURL={stream.toURL ? stream.toURL() : ''}
                style={style}
                objectFit="cover"
                mirror={isLocal}
                zOrder={isLocal ? 1 : 0}
            />
        );
    };

    return (
        <>
            {remoteStream ? (
                renderVideo(remoteStream, styles.remoteVideo)
            ) : (
                <View style={styles.nativePlaceholder}>
                    <Ionicons name="person" size={80} color="#666" />
                    <Text style={styles.nativeText}>Waiting for remote video...</Text>
                </View>
            )}

            {localStream && !isCameraOff ? (
                renderVideo(localStream, styles.localVideo, true)
            ) : (
                isCameraOff && (
                    <View style={[styles.localVideo, styles.cameraOffPlaceholder]}>
                        <Ionicons name="videocam-off" size={24} color="#fff" />
                    </View>
                )
            )}
        </>
    );
};

const styles = StyleSheet.create({
    remoteVideo: { width: '100%', height: '100%', backgroundColor: '#000' },
    localVideo: {
        width: 120,
        height: 180,
        position: 'absolute',
        top: 20,
        right: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#000',
        zIndex: 10
    },
    cameraOffPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12
    },
    nativePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    nativeText: { color: '#666', marginTop: 20 },
});
