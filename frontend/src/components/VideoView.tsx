import React from 'react';
import { View, StyleSheet } from 'react-native';

interface VideoViewProps {
    localStream: any;
    remoteStream: any;
    isCameraOff: boolean;
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    webStyles: any;
}

/**
 * Web-specific VideoView
 */
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
            {remoteStream && (
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{ ...styles.remoteVideo, ...webStyles.video }}
                />
            )}

            {localStream && !isCameraOff && (
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ ...styles.localVideo, ...webStyles.video }}
                />
            )}

            {isCameraOff && (
                <View style={[styles.localVideo, styles.cameraOffPlaceholder]} />
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
});
