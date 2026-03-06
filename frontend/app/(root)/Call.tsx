import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { WebRTCService } from '@/src/services/WebRTCService';
import SocketService from '@/src/services/SocketService';

import { VideoView } from '@/src/components/VideoView';

// Helper: attach a MediaStream to a hidden <audio> element for audio-only calls on web.
// React Native audio is handled automatically by react-native-webrtc's native layer.
function attachAudioToElement(element: HTMLAudioElement | null, stream: any) {
    if (!element || !stream) return;
    if (element.srcObject !== stream) {
        element.srcObject = stream;
        element.play().catch((e: any) => console.warn('Audio play failed:', e));
    }
}

export default function CallScreen() {
    const { user } = useAuth();
    const { convoId, participantId, callType, incoming, fromName, signal: rawSignal, autoAnswer } = useLocalSearchParams();
    // Expo Router can return params as string[] on web — always coerce to string
    const signal = Array.isArray(rawSignal) ? rawSignal[0] : rawSignal;
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
    // Hidden audio element used only on web for audio-only calls
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        socket.current = SocketService.getSocket(user.id);

        // Create the service instance
        if (!webRTCService.current) {
            webRTCService.current = new WebRTCService();
        }

        // Register ALL callbacks FIRST — before any async work — so no events are missed
        webRTCService.current.onRemoteStream((stream) => {
            console.log('Remote stream received in CallScreen');
            setRemoteStream(stream);
        });

        webRTCService.current.onIceCandidate((candidate) => {
            // Always use participantId for socket routing (it's the other user's ID)
            socket.current.emit('ice_candidate', {
                to: participantId,
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
                if (incoming !== 'true') {
                    // Outgoing call: request permissions explicitly before getting stream
                    setCallStatus('Requesting Permissions...');

                    const stream = await webRTCService.current?.getLocalStream(callType === 'video');
                    if (stream) {
                        setLocalStream(stream);
                    } else {
                        throw new Error('Could not get local stream');
                    }

                    const offer = await webRTCService.current?.createOffer();
                    socket.current.emit('call_user', {
                        userToCall: participantId,
                        from: user.id,
                        name: user.name || 'User ' + user.id,
                        callType: callType || 'audio',
                        signalData: offer
                    });
                    console.log(`Starting ${callType} call (Offer sent to ${participantId})`);
                } else if (autoAnswer === 'true') {
                    // Incoming call with auto-answer (from banner "Accept" tap)
                    setTimeout(() => acceptCall(), 500);
                }
                // If incoming but NOT autoAnswer, the user sees the in-screen accept UI
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

    // Create a hidden <audio> element for web audio-only calls once on mount
    useEffect(() => {
        if (Platform.OS === 'web' && callType !== 'video') {
            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
            remoteAudioRef.current = audioEl;
            return () => {
                audioEl.srcObject = null;
                document.body.removeChild(audioEl);
            };
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === 'web') {
            if (callType === 'video') {
                // Video call: attach streams to <video> elements
                if (localVideoRef.current && localStream) {
                    localVideoRef.current.srcObject = localStream;
                }
                if (remoteVideoRef.current && remoteStream) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            } else {
                // Audio call: play remote stream through the hidden <audio> element
                attachAudioToElement(remoteAudioRef.current, remoteStream);
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
        // Only log if we have a valid numeric convoId
        const convoIdNum = Number(convoId);
        if (!convoId || isNaN(convoIdNum) || convoIdNum <= 0) {
            console.warn('saveCallLog: no valid convoId available, skipping log');
            return;
        }
        const finalDuration = formatDuration(duration);
        socket.current.emit('save_call_log', {
            conversation_id: convoIdNum,
            sender_id: user.id,
            text: status === 'Missed' ? `Missed ${callType} call` : `${callType === 'video' ? 'Video' : 'Audio'} call`,
            callType,
            duration: status === 'Missed' ? null : finalDuration,
            status
        });
    };

    const endCall = () => {
        // Always route to participantId (the other user), never convoId
        socket.current.emit('end_call', { to: participantId });
        saveCallLog('Finished');
        webRTCService.current?.close();
        router.back();
    };

    const acceptCall = async () => {
        setCallStatus('Connecting...');

        // Only get local stream if we don't already have one (prevents double-add)
        if (!localStream && webRTCService.current) {
            try {
                const stream = await webRTCService.current.getLocalStream(callType === 'video');
                if (stream) setLocalStream(stream);
            } catch (err) {
                console.error('Failed to get local stream on accept:', err);
                setCallStatus('Permission Denied');
                setTimeout(() => router.back(), 2000);
                return;
            }
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
