import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoViewProps {
    localStream: any;
    remoteStream: any;
    isCameraOff: boolean;
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    webStyles: any;
}

export const VideoView = ({
    localStream,
    remoteStream,
    isCameraOff,
    localVideoRef,
    remoteVideoRef,
    webStyles
}: VideoViewProps) => {
    return (
        <>
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                    ...styles.remoteVideo,
                    ...webStyles.video
                }}
            />
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                    ...styles.localVideo,
                    ...webStyles.video,
                    opacity: isCameraOff ? 0 : 1
                }}
            />
            {isCameraOff && (
                <View style={[styles.localVideo, styles.cameraOffPlaceholder]}>
                    <Ionicons name="videocam-off" size={24} color="#fff" />
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    remoteVideo: { width: '100%', height: '100%' } as any,
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
    } as any,
    cameraOffPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
});
