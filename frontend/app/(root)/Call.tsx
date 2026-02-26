import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { WebRTCService } from '@/src/services/WebRTCService';
import SocketService from '@/src/services/SocketService';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function CallScreen() {
    const { user } = useAuth();
    const { convoId, participantId, callType, incoming, fromName, signal, autoAnswer } = useLocalSearchParams();
    const router = useRouter();
    const [callStatus, setCallStatus] = useState(incoming === 'true' ? 'Incoming Call...' : 'Calling...');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [duration, setDuration] = useState(0);
    const durationInterval = useRef<any>(null);

    const socket = useRef<any>(null);
    const webRTCService = useRef<WebRTCService | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        socket.current = SocketService.getSocket(user.id);

        webRTCService.current = new WebRTCService();

        webRTCService.current.onRemoteStream((stream) => {
            console.log('Remote stream received');
            setRemoteStream(stream);
        });

        webRTCService.current.onIceCandidate((candidate) => {
            socket.current.emit('ice_candidate', {
                to: incoming === 'true' ? participantId : (participantId || convoId),
                candidate: candidate
            });
        });

        const startCallAction = async () => {
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
                // If autoAnswer is passed, wait a small bit for stream and then connect
                setTimeout(() => {
                    acceptCall();
                }, 500);
            }
        };

        startCallAction();

        socket.current.on('call_accepted', async (signal: any) => {
            setCallStatus('Connected');
            startTimer();
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
        };
    }, []);

    useEffect(() => {
        if (Platform.OS === 'web') {
            if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
                console.log('Attached local stream to video element');
            }
            if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                console.log('Attached remote stream to video element');
            }
        }
    }, [localStream, remoteStream]);

    const startTimer = () => {
        durationInterval.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (durationInterval.current) clearInterval(durationInterval.current);
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
        // Notify the other side
        socket.current.emit('end_call', { to: participantId });

        saveCallLog('Finished');
        webRTCService.current?.close();
        router.back();
    };

    const acceptCall = async () => {
        setCallStatus('Connecting...');

        // Ensure we have local stream before answering
        if (!localStream && webRTCService.current) {
            const stream = await webRTCService.current.getLocalStream(callType === 'video');
            if (stream) setLocalStream(stream);
        }

        if (webRTCService.current && signal) {
            try {
                const offer = JSON.parse(signal as string);
                const answer = await webRTCService.current.handleOffer(offer);
                socket.current.emit('answer_call', {
                    to: participantId,
                    signal: answer
                });
                setCallStatus('Connected');
                startTimer();
            } catch (error) {
                console.error('Error accepting call:', error);
                setCallStatus('Failed to connect');
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.callerInfo}>
                {callType === 'video' && Platform.OS === 'web' ? (
                    <View style={styles.videoContainer}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={styles.remoteVideo}
                        />
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={styles.localVideo}
                        />
                    </View>
                ) : (
                    <View style={styles.avatarLarge} />
                )}
                <Text style={styles.callerName}>
                    <Text>{incoming === 'true' ? (fromName || 'Incoming') : 'Outgoing Call'}</Text>
                </Text>
                <Text style={styles.callStatus}>
                    {callStatus === 'Connected' ? formatDuration(duration) : callStatus}
                </Text>
            </View>

            <View style={styles.controls}>
                {incoming === 'true' && callStatus === 'Incoming Call...' ? (
                    <View style={styles.incomingControls}>
                        <TouchableOpacity style={[styles.controlBtn, styles.declineBtn]} onPress={endCall}>
                            <Ionicons name="close" size={32} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlBtn, styles.acceptBtn]} onPress={acceptCall}>
                            <Ionicons name="call" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={endCall}>
                        <Ionicons name="call-outline" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#075E54', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
    callerInfo: { alignItems: 'center', marginTop: 50, width: '100%' },
    avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', marginBottom: 20 },
    callerName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    callStatus: { color: '#fff', fontSize: 18, opacity: 0.8, marginTop: 10 },
    videoContainer: { width: '90%', height: 400, backgroundColor: '#000', borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 20 },
    remoteVideo: { width: '100%', height: '100%', objectFit: 'cover' },
    localVideo: { width: 100, height: 150, position: 'absolute', bottom: 10, right: 10, borderRadius: 10, backgroundColor: '#333', objectFit: 'cover' },
    controls: { marginBottom: 50, width: '100%', alignItems: 'center' },
    incomingControls: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' },
    controlBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    acceptBtn: { backgroundColor: '#25D366' },
    declineBtn: { backgroundColor: '#FF3B30' },
    endBtn: { backgroundColor: '#FF3B30' }
});
