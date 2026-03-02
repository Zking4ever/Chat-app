import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { WebRTCService } from '@/src/services/WebRTCService';
import SocketService from '@/src/services/SocketService';

import { VideoView } from '@/src/components/VideoView';

export default function CallScreen() {
    const { user } = useAuth();
    const { convoId, participantId, callType, incoming, fromName, signal, autoAnswer } = useLocalSearchParams();
    const router = useRouter();

    const [callStatus, setCallStatus] = useState(incoming === 'true' ? 'Incoming Call...' : 'Calling...');
    const [localStream, setLocalStream] = useState<any>(null);
    const [remoteStream, setRemoteStream] = useState<any>(null);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [connectionState, setConnectionState] = useState<any>('new');

    const durationInterval = useRef<any>(null);
    const socket = useRef<any>(null);
    const webRTCService = useRef<WebRTCService | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        socket.current = SocketService.getSocket(user.id);

        if (!webRTCService.current) {
            webRTCService.current = new WebRTCService();
        }

        webRTCService.current.onRemoteStream((stream) => {
            console.log('Remote stream received in CallScreen');
            setRemoteStream(stream);
        });

        webRTCService.current.onIceCandidate((candidate) => {
            socket.current.emit('ice_candidate', {
                to: incoming === 'true' ? participantId : (participantId || convoId),
                candidate: candidate
            });
        });

        webRTCService.current.onConnectionState((state) => {
            setConnectionState(state);
            if (state === 'connected') {
                setCallStatus('Connected');
                startTimer();
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                setCallStatus('Call Ended');
                setTimeout(() => router.back(), 2000);
            }
        });

        const startCallAction = async () => {
            try {
                const stream = await webRTCService.current?.getLocalStream(callType === 'video');
                if (stream) setLocalStream(stream);

                if (incoming !== 'true') {
                    const offer = await webRTCService.current?.createOffer();
                    socket.current.emit('call_user', {
                        userToCall: participantId || convoId,
                        from: user.id,
                        name: user.name || 'User ' + user.id,
                        callType: callType || 'audio',
                        signalData: offer
                    });
                    console.log(`Starting ${callType} call...`);
                } else if (autoAnswer === 'true') {
                    setTimeout(() => acceptCall(), 500);
                }
            } catch (err) {
                console.error('Failed to start call:', err);
                setCallStatus('Permission Denied');
                setTimeout(() => router.back(), 2000);
            }
        };

        startCallAction();

        socket.current.on('call_accepted', async (signal: any) => {
            if (signal) {
                await webRTCService.current?.handleAnswer(signal);
            }
        });

        socket.current.on('ice_candidate', (candidate: any) => {
            webRTCService.current?.addIceCandidate(candidate);
        });

        socket.current.on('call_ended', () => {
            setCallStatus('Call Ended');
            setTimeout(() => router.back(), 1500);
        });

        socket.current.on('call_rejected', () => {
            setCallStatus('Call Rejected');
            saveCallLog('Missed');
            setTimeout(() => router.back(), 2000);
        });

        return () => {
            stopTimer();
            webRTCService.current?.close();
            if (socket.current) {
                socket.current.off('call_accepted');
                socket.current.off('ice_candidate');
                socket.current.off('call_ended');
                socket.current.off('call_rejected');
            }
        };
    }, []);

    useEffect(() => {
        if (Platform.OS === 'web') {
            if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
            }
            if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        }
    }, [localStream, remoteStream]);

    const startTimer = () => {
        if (durationInterval.current) return;
        durationInterval.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const saveCallLog = (status: string) => {
        const finalDuration = formatDuration(duration);
        socket.current.emit('save_call_log', {
            conversation_id: Number(convoId),
            sender_id: user.id,
            text: status === 'Missed' ? `Missed ${callType} call` : `${callType === 'video' ? 'Video' : 'Audio'} call`,
            callType,
            duration: status === 'Missed' ? null : finalDuration,
            status
        });
    };

    const endCall = () => {
        socket.current.emit('end_call', { to: participantId || convoId });
        saveCallLog('Finished');
        webRTCService.current?.close();
        router.back();
    };

    const acceptCall = async () => {
        setCallStatus('Connecting...');

        if (!localStream && webRTCService.current) {
            const stream = await webRTCService.current.getLocalStream(callType === 'video');
            if (stream) setLocalStream(stream);
        }

        if (webRTCService.current && signal) {
            try {
                const offer = typeof signal === 'string' ? JSON.parse(signal) : signal;
                const answer = await webRTCService.current.handleOffer(offer);
                socket.current.emit('answer_call', {
                    to: participantId,
                    signal: answer
                });
            } catch (error) {
                console.error('Error accepting call:', error);
                setCallStatus('Failed to connect');
            }
        }
    };

    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        webRTCService.current?.toggleAudio(!newState);
    };

    const toggleCamera = () => {
        const newState = !isCameraOff;
        setIsCameraOff(newState);
        webRTCService.current?.toggleVideo(!newState);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.callerName}>
                    {incoming === 'true' ? (fromName || 'Incoming') : 'Calling...'}
                </Text>
                <Text style={styles.callStatus}>
                    {connectionState === 'connected' ? formatDuration(duration) : callStatus}
                </Text>
            </View>

            <View style={styles.videoContent}>
                {callType === 'video' ? (
                    <View style={styles.videoContainer}>
                        <VideoView
                            localStream={localStream}
                            remoteStream={remoteStream}
                            isCameraOff={isCameraOff}
                            localVideoRef={localVideoRef as any}
                            remoteVideoRef={remoteVideoRef as any}
                            webStyles={webStyles}
                        />
                    </View>
                ) : (
                    <View style={styles.audioContainer}>
                        <View style={styles.avatarLarge}>
                            <Ionicons name="person" size={80} color="#fff" />
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.mainControls}>
                    <TouchableOpacity
                        style={[styles.smallControlBtn, isMuted && styles.activeControlBtn]}
                        onPress={toggleMute}
                    >
                        <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
                    </TouchableOpacity>

                    {callType === 'video' && (
                        <TouchableOpacity
                            style={[styles.smallControlBtn, isCameraOff && styles.activeControlBtn]}
                            onPress={toggleCamera}
                        >
                            <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {incoming === 'true' && callStatus === 'Incoming Call...' ? (
                    <View style={styles.incomingControls}>
                        <TouchableOpacity style={[styles.largeControlBtn, styles.declineBtn]} onPress={endCall}>
                            <Ionicons name="close" size={32} color="#fff" />
                            <Text style={styles.btnLabel}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.largeControlBtn, styles.acceptBtn]} onPress={acceptCall}>
                            <Ionicons name="call" size={32} color="#fff" />
                            <Text style={styles.btnLabel}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.largeControlBtn, styles.endBtn]} onPress={endCall}>
                        <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                        <Text style={styles.btnLabel}>End Call</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
    callerName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
    callStatus: { color: '#25D366', fontSize: 18, fontWeight: '500' },
    videoContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    videoContainer: { width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' },
    remoteVideo: { width: '100%', height: '100%' },
    localVideo: { width: 120, height: 180, position: 'absolute', top: 20, right: 20, borderRadius: 12, borderWidth: 2, borderColor: '#333', backgroundColor: '#000', zIndex: 10 },
    cameraOffPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
    audioContainer: { justifyContent: 'center', alignItems: 'center' },
    avatarLarge: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#075E54', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    nativePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    nativeText: { color: '#666', marginTop: 20 },
    footer: { paddingBottom: 50, paddingHorizontal: 20, alignItems: 'center' },
    mainControls: { flexDirection: 'row', marginBottom: 30, gap: 20 },
    smallControlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    activeControlBtn: { backgroundColor: '#FF3B30' },
    largeControlBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    incomingControls: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
    acceptBtn: { backgroundColor: '#25D366' },
    declineBtn: { backgroundColor: '#FF3B30' },
    endBtn: { backgroundColor: '#FF3B30' },
    btnLabel: { color: '#fff', fontSize: 12, marginTop: 5 }
});

const webStyles = {
    video: {
        objectFit: 'cover' as const
    }
};
