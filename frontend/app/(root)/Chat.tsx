import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { chatAPI } from '@/lib/api';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function ChatScreen() {
    const { user } = useAuth();
    const { convoId } = useLocalSearchParams();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const socket = useRef<any>(null);

    useEffect(() => {
        // Fetch history
        fetchMessages();

        // Init socket
        socket.current = io(SOCKET_URL);
        socket.current.emit('join', user.id);

        socket.current.on('message', (msg: any) => {
            if (msg.conversation_id === Number(convoId)) {
                setMessages(prev => [...prev, msg] as any);
            }
        });

        return () => {
            socket.current.disconnect();
        };
    }, [convoId]);

    const fetchMessages = async () => {
        try {
            const response = await chatAPI.getMessages(Number(convoId));
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const msgData = {
            conversation_id: Number(convoId),
            sender_id: user.id,
            text: inputText,
        };

        try {
            const response = await chatAPI.sendMessage(msgData);
            const newMsg = { ...msgData, id: response.data.id, sent_at: new Date().toISOString(), status: 'sent' };
            setMessages(prev => [...prev, newMsg] as any);
            setInputText('');

            // Notify via socket (the server should ideally handle broadcasting)
            socket.current.emit('send_message', newMsg);
        } catch (error) {
            console.error('Send failed', error);
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={[
            styles.messageBox,
            item.sender_id === user.id ? styles.myMessage : styles.theirMessage
        ]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>
                {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chat #{convoId}</Text>
            </View>

            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.messageList}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Text style={styles.sendBtnText}>{'>'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E5DDD5' },
    header: { height: 60, backgroundColor: '#075E54', justifyContent: 'center', paddingHorizontal: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    messageList: { padding: 10 },
    messageBox: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#DCF8C6',
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF',
    },
    messageText: { fontSize: 16 },
    messageTime: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 5 },
    inputArea: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        maxHeight: 100,
    },
    sendBtn: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#075E54',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});
