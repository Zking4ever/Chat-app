import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function CallScreen() {
    const { user } = useAuth();
    const { convoId, callType, incoming } = useLocalSearchParams();
    const router = useRouter();
    const [callStatus, setCallStatus] = useState(incoming === 'true' ? 'Incoming Call...' : 'Calling...');
    const socket = useRef<any>(null);

    useEffect(() => {
        socket.current = io(SOCKET_URL);
        socket.current.emit('join', user.id);

        if (incoming === 'true') {
            // Handle incoming call signaling logic here
        } else {
            // Initiate call signaling logic here
            // socket.current.emit('call_user', { ... });
        }

        socket.current.on('call_accepted', () => {
            setCallStatus('Connected');
        });

        socket.current.on('call_rejected', () => {
            setCallStatus('Call Rejected');
            setTimeout(() => router.back(), 2000);
        });

        return () => {
            socket.current.disconnect();
        };
    }, []);

    const endCall = () => {
        // socket.current.emit('end_call', { ... });
        router.back();
    };

    const acceptCall = () => {
        setCallStatus('Connecting...');
        // socket.current.emit('answer_call', { ... });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.callerInfo}>
                <View style={styles.avatarLarge} />
                <Text style={styles.callerName}>Chat #{convoId}</Text>
                <Text style={styles.callStatus}>{callStatus}</Text>
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
    callerInfo: { alignItems: 'center', marginTop: 50 },
    avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', marginBottom: 20 },
    callerName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    callStatus: { color: '#fff', fontSize: 18, opacity: 0.8, marginTop: 10 },
    controls: { marginBottom: 50, width: '100%', alignItems: 'center' },
    incomingControls: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' },
    controlBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    acceptBtn: { backgroundColor: '#25D366' },
    declineBtn: { backgroundColor: '#FF3B30' },
    endBtn: { backgroundColor: '#FF3B30' }
});
