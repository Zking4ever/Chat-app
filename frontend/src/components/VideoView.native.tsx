import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';

interface VideoViewProps {
    localStream: any;
    remoteStream: any;
    isCameraOff: boolean;
    localVideoRef: any;
    remoteVideoRef: any;
    webStyles: any;
}

export const VideoView = ({
    localStream,
    remoteStream,
    isCameraOff,
}: VideoViewProps) => {
    return (
        <>
            {remoteStream ? (
                <RTCView
                    streamURL={remoteStream.toURL ? remoteStream.toURL() : ''}
                    style={styles.remoteVideo}
                    objectFit="cover"
                />
            ) : (
                <View style={styles.nativePlaceholder}>
                    <Ionicons name="person" size={80} color="#666" />
                    <Text style={styles.nativeText}>Waiting for remote video...</Text>
                </View>
            )}

            {localStream && !isCameraOff && (
                <RTCView
                    streamURL={localStream.toURL ? localStream.toURL() : ''}
                    style={styles.localVideo}
                    objectFit="cover"
                    zOrder={1}
                />
            )}

            {isCameraOff && (
                <View style={[styles.localVideo, styles.cameraOffPlaceholder]}>
                    <Ionicons name="videocam-off" size={24} color="#fff" />
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    remoteVideo: { width: '100%', height: '100%' },
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
    cameraOffPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
    nativePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    nativeText: { color: '#666', marginTop: 20 },
});
