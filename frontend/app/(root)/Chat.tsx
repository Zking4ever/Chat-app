import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import SocketService from '@/src/services/SocketService';
import { useAuth } from '@/context/AuthContext';
import { chatAPI } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
    const { user } = useAuth();
    const { convoId, participantId, participantName } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const navigation = useNavigation();
    const socket = useRef<any>(null);

    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        // Fetch history
        fetchMessages();

        // Init socket
        socket.current = SocketService.getSocket(user.id);

        const handleMessage = (msg: any) => {
            if (msg.conversation_id === Number(convoId)) {
                setMessages(prev => [...prev, msg]);
            }
        };

        const handleTypingStatus = (data: any) => {
            if (data.convoId === Number(convoId) && data.userId !== user.id) {
                setIsTyping(data.isTyping);
                setTypingUser(data.userName);
            }
        };

        socket.current.on('message', handleMessage);
        socket.current.on('typing_status', handleTypingStatus);

        return () => {
            socket.current.off('message', handleMessage);
            socket.current.off('typing_status', handleTypingStatus);
        };
    }, [convoId]);

    const handleTextInput = (text: string) => {
        setInputText(text);

        // Emit typing status
        socket.current.emit('typing', { convoId: Number(convoId), userId: user.id, userName: user.name });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.current.emit('stop_typing', { convoId: Number(convoId), userId: user.id });
        }, 2000);
    };

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
            const newMsg = { ...msgData, id: response.data.id, sent_at: new Date().toISOString(), status: 'sent', message_type: 'text' };
            setMessages(prev => [...prev, newMsg]);
            setInputText('');

            // Stop typing immediately on send
            socket.current.emit('stop_typing', { convoId: Number(convoId), userId: user.id });

            // Notify via socket (the server should ideally handle broadcasting)
            socket.current.emit('send_message', newMsg);
        } catch (error) {
            console.error('Send failed', error);
        }
    };

    const startCall = (type: 'audio' | 'video') => {
        navigation.navigate('Call' as any, {
            convoId,
            participantId,
            participantName,
            callType: type,
            incoming: 'false',
            fromName: user.name
        });
    };

    const renderItem = ({ item }: any) => {
        const isMe = item.sender_id === user.id;

        if (item.message_type === 'call') {
            const meta = item.metadata ? JSON.parse(item.metadata) : {};
            const iconName = meta.callType === 'video' ? 'videocam' : 'call';

            return (
                <View style={styles.callLogContainer}>
                    <View style={styles.callLogBox}>
                        <View style={styles.callLogIcon}>
                            <Ionicons name={iconName as any} size={20} color="#555" />
                        </View>
                        <View>
                            <Text style={styles.callLogText}>{item.text}</Text>
                            <Text style={styles.callLogSubtext}>
                                {meta.duration ? `${meta.duration} • ` : ''}
                                {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={[
                styles.messageBox,
                isMe ? styles.myMessage : styles.theirMessage
            ]}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.messageTime}>
                    {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{participantName || `Chat #${convoId}`}</Text>
                        {isTyping && <Text style={styles.typingIndicatorText}>{typingUser} is typing...</Text>}
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => startCall('audio')} style={styles.actionBtn}>
                        <Ionicons name="call" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startCall('video')} style={styles.actionBtn}>
                        <Ionicons name="videocam" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
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
                        onChangeText={handleTextInput}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E5DDD5' },
    header: {
        height: 60,
        backgroundColor: '#075E54',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        marginLeft: 20,
    },
    typingIndicatorText: {
        color: '#eee',
        fontSize: 12,
        fontStyle: 'italic',
    },
    backBtn: { marginRight: 15 },
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
    sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    callLogContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    callLogBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    callLogIcon: {
        marginRight: 10,
    },
    callLogText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    callLogSubtext: {
        fontSize: 11,
        color: '#777',
    },
});
