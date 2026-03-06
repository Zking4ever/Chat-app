import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import {
    FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SocketService from '@/src/services/SocketService';
import { useAuth } from '@/context/AuthContext';
import { chatAPI } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { getImageUrl } from '@/lib/imageUrl';

import { useTheme } from '@/context/ThemeContext';

export default function ChatScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const { convoId, participantId, participantName } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const navigation = useNavigation();
    const router = useRouter();
    const socket = useRef<any>(null);

    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const typingTimeoutRef = useRef<any>(null);

    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{
        uri: string;
        name: string;
        type: 'image' | 'document';
        mimeType: string;
    } | null>(null);

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimerRef = useRef<any>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);

    const heartOpacity = useSharedValue(0);
    const heartScale = useSharedValue(0);
    const heartY = useSharedValue(0);

    const heartStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        right: 60,
        bottom: 80,
        opacity: heartOpacity.value,
        transform: [{ scale: heartScale.value }, { translateY: heartY.value }],
    }));

    const triggerHeart = () => {
        heartOpacity.value = 1;
        heartScale.value = withSpring(1.5);
        heartY.value = withTiming(-150, { duration: 1000 }, () => {
            heartOpacity.value = withTiming(0);
            heartScale.value = 0;
            heartY.value = 0;
        });
    };

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
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [convoId, sound]);

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

    const toBase64 = async (uri: string) => {
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    };

    const handleSend = async () => {
        if (!inputText.trim() && !selectedFile) return;

        const tempId = Date.now();
        const msgType = selectedFile ? selectedFile.type : 'text';

        // Optimistic UI message
        const optimisticMsg = {
            id: tempId,
            conversation_id: Number(convoId),
            sender_id: user.id,
            text: selectedFile ? selectedFile.uri : inputText.trim(), // Local URI for preview
            message_type: msgType,
            sent_at: new Date().toISOString(),
            status: 'sending',
            metadata: selectedFile ? JSON.stringify({ originalName: selectedFile.name, caption: inputText.trim() || undefined }) : null
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputText('');
        setSelectedFile(null);
        triggerHeart();

        try {
            let finalMsgData = { ...optimisticMsg };
            delete (finalMsgData as any).status; // Server sets initial status

            if (optimisticMsg.message_type !== 'text' && optimisticMsg.text) {
                setUploading(true);

                // Read base64 (cross-platform)
                const base64Data = await toBase64(optimisticMsg.text);
                const mimeType = optimisticMsg.message_type === 'image' ? 'image/jpeg' : 'application/octet-stream';
                const dataUrl = `data:${mimeType};base64,${base64Data}`;

                const uploadRes = await chatAPI.uploadFile({
                    fileData: dataUrl,
                    fileName: JSON.parse(optimisticMsg.metadata!).originalName || 'file'
                });

                finalMsgData.text = uploadRes.data.url;
                const updatedMeta = JSON.parse(optimisticMsg.metadata!);
                updatedMeta.filename = uploadRes.data.filename;
                finalMsgData.metadata = JSON.stringify(updatedMeta);
            }

            const { id, status, sent_at, ...apiMsgData } = finalMsgData;
            const response = await chatAPI.sendMessage({
                ...apiMsgData,
                metadata: apiMsgData.metadata || undefined
            });

            // Update local state with real ID and 'sent' status
            setMessages(prev => prev.map(m => m.id === tempId ? { ...finalMsgData, id: response.data.id, status: 'sent', sent_at: new Date().toISOString() } : m));

            // Stop typing immediately on send
            socket.current.emit('stop_typing', { convoId: Number(convoId), userId: user.id });

            // Notify via socket
            socket.current.emit('send_message', { ...finalMsgData, id: response.data.id, status: 'sent', sent_at: new Date().toISOString() });

        } catch (error) {
            console.error('Send failed', error);
            // Mark as failed in UI if possible
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = async (type: 'image' | 'document') => {
        try {
            let result;
            if (type === 'image') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                });
            } else {
                result = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
                    copyToCacheDirectory: true,
                });
            }

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0] as any;
            setSelectedFile({
                uri: asset.uri,
                name: asset.fileName || asset.name || (type === 'image' ? 'image.jpg' : 'file.bin'),
                type,
                mimeType: asset.mimeType || (type === 'image' ? 'image/jpeg' : 'application/octet-stream')
            });
        } catch (error) {
            console.error('Pick failed', error);
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') return;

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
            setRecordingDuration(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async (cancel: boolean = false) => {
        if (!recording) return;

        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        const duration = recordingDuration;
        setRecordingDuration(0);

        if (cancel || !uri) return;

        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            conversation_id: Number(convoId),
            sender_id: user.id,
            text: uri,
            message_type: 'audio',
            sent_at: new Date().toISOString(),
            status: 'sending',
            metadata: JSON.stringify({ duration })
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            setUploading(true);
            const base64Data = await toBase64(uri);
            const dataUrl = `data:audio/m4a;base64,${base64Data}`;

            const uploadRes = await chatAPI.uploadFile({
                fileData: dataUrl,
                fileName: `audio_${Date.now()}.m4a`
            });
            const { url, filename } = uploadRes.data;

            const finalMsgData = {
                ...optimisticMsg,
                text: url,
                metadata: JSON.stringify({ filename, duration })
            };

            const response = await chatAPI.sendMessage(finalMsgData);
            const newMsg = { ...finalMsgData, id: response.data.id, status: 'sent', sent_at: new Date().toISOString() };

            setMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));
            socket.current.emit('send_message', newMsg);
        } catch (error) {
            console.error('Voice message failed', error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        } finally {
            setUploading(false);
        }
    };

    const playAudio = async (messageId: number, uri: string) => {
        try {
            if (sound) {
                await sound.unloadAsync();
                if (playingMessageId === messageId) {
                    setPlayingMessageId(null);
                    setSound(null);
                    return;
                }
            }

            const fullUri = getImageUrl(uri) || '';
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: fullUri });
            setSound(newSound);
            setPlayingMessageId(messageId);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.didJustFinish) {
                    setPlayingMessageId(null);
                    setSound(null);
                }
            });

            await newSound.playAsync();
        } catch (error) {
            console.error('Error playing audio', error);
        }
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const startCall = (type: 'audio' | 'video') => {
        router.push({
            pathname: '/(root)/Call',
            params: {
                convoId: String(convoId),
                participantId: String(participantId),
                participantName: String(participantName),
                callType: type,
                incoming: 'false',
                fromName: user.name
            }
        } as any);
    };

    const renderItem = ({ item }: any) => {
        const isMe = item.sender_id === user.id;

        if (item.message_type === 'call') {
            const meta = item.metadata ? JSON.parse(item.metadata) : {};
            const iconName = meta.callType === 'video' ? 'videocam' : 'call';

            const isMissed = item.text.startsWith('Missed');
            let callTitle = isMe ? `Outgoing ${meta.callType || 'audio'} call` : `Incoming ${meta.callType || 'audio'} call`;

            if (isMissed) {
                callTitle = isMe ? `Canceled ${meta.callType || 'audio'} call` : `Missed ${meta.callType || 'audio'} call`;
            }

            // Capitalize first letter
            callTitle = callTitle.charAt(0).toUpperCase() + callTitle.slice(1);

            return (
                <View style={[styles.callLogContainer, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <View style={[styles.callLogBox, { backgroundColor: colors.surface, borderColor: isMissed ? '#ef4444' : colors.tint }]}>
                        <View style={styles.callLogIcon}>
                            <Ionicons name={iconName as any} size={20} color={isMissed ? '#ef4444' : colors.tint} />
                        </View>
                        <View>
                            <Text style={[styles.callLogText, { color: isMissed ? '#ef4444' : colors.text }]}>
                                {callTitle}
                            </Text>
                            <Text style={[styles.callLogSubtext, { color: colors.textSecondary }]}>
                                {meta.duration && !isMissed ? `${meta.duration} • ` : ''}
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
                isMe ? [styles.myMessage, { backgroundColor: colors.bubbleSent }] : [styles.theirMessage, { backgroundColor: colors.bubbleReceived }]
            ]}>
                {item.message_type === 'image' ? (
                    <View style={[styles.imageWrapper, { borderColor: isMe ? 'rgba(255,255,255,0.2)' : colors.surface }]}>
                        <Image source={{ uri: item.status === 'sending' ? item.text : getImageUrl(item.text) }} style={styles.messageImage} />
                        {item.metadata && JSON.parse(item.metadata).caption && (
                            <Text style={[styles.messageText, { color: isMe ? colors.text2 : colors.text, marginTop: 5, paddingHorizontal: 5 }]}>
                                {JSON.parse(item.metadata).caption}
                            </Text>
                        )}
                    </View>
                ) : item.message_type === 'document' ? (
                    <View style={[styles.documentWrapper, { borderColor: isMe ? 'rgba(255,255,255,0.2)' : colors.surface }]}>
                        <View style={[styles.documentContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : colors.surface }]}>
                            <Ionicons name="document-text" size={24} color={isMe ? '#fff' : colors.tint} />
                            <Text style={[styles.documentName, { color: isMe ? colors.text2 : colors.text }]} numberOfLines={1}>
                                {item.metadata ? JSON.parse(item.metadata).originalName : 'Document'}
                            </Text>
                        </View>
                        {item.metadata && JSON.parse(item.metadata).caption && (
                            <Text style={[styles.messageText, { color: isMe ? colors.text2 : colors.text, marginTop: 5, paddingHorizontal: 5 }]}>
                                {JSON.parse(item.metadata).caption}
                            </Text>
                        )}
                    </View>
                ) : item.message_type === 'audio' ? (
                    <View style={[styles.audioWrapper, { borderColor: isMe ? 'rgba(255,255,255,0.2)' : colors.surface }]}>
                        <View style={styles.audioContainer}>
                            <TouchableOpacity onPress={() => playAudio(item.id, item.text)} style={styles.playPauseBtn}>
                                <Ionicons name={playingMessageId === item.id ? "pause" : "play"} size={20} color={isMe ? '#fff' : colors.tint} />
                            </TouchableOpacity>
                            <Text style={[styles.audioDuration, { color: isMe ? colors.text2 : colors.text }]}>
                                {item.metadata && JSON.parse(item.metadata).duration
                                    ? formatDuration(JSON.parse(item.metadata).duration)
                                    : 'Voice Note'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={[styles.messageText, { color: isMe ? colors.text2 : colors.text }]}>{item.text}</Text>
                )}
                <View style={styles.messageFooter}>
                    {item.status === 'sending' && (
                        <ActivityIndicator size={10} color={isMe ? '#fff' : colors.tint} style={{ marginRight: 5 }} />
                    )}
                    <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                        {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.headerText} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.headerText }]}>{participantName || `Chat #${convoId}`}</Text>
                        {isTyping && <Text style={[styles.typingIndicatorText, { color: colors.headerText, opacity: 0.8 }]}>{typingUser} is typing...</Text>}
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => startCall('audio')} style={styles.actionBtn}>
                        <Ionicons name="call" size={22} color={colors.headerText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startCall('video')} style={styles.actionBtn}>
                        <Ionicons name="videocam" size={22} color={colors.headerText} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.messageList}
            />

            <Animated.View style={heartStyle}>
                <Text style={{ fontSize: 40 }}>❤️</Text>
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {selectedFile && (
                    <View style={[styles.previewContainer, { backgroundColor: colors.surface, borderTopColor: colors.background }]}>
                        <TouchableOpacity style={styles.previewClose} onPress={() => setSelectedFile(null)}>
                            <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                        </TouchableOpacity>
                        {selectedFile.type === 'image' ? (
                            <Image source={{ uri: selectedFile.uri }} style={styles.previewImageThumb} />
                        ) : (
                            <View style={[styles.previewDocument, { backgroundColor: colors.background }]}>
                                <Ionicons name="document-text" size={32} color={colors.tint} />
                                <Text style={[styles.previewDocumentText, { color: colors.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: selectedFile ? 'transparent' : colors.background }]}>
                    {isRecording ? (
                        <View style={styles.recordingContainer}>
                            <ActivityIndicator size="small" color="#ef4444" style={{ marginRight: 10 }} />
                            <Text style={{ color: '#ef4444', flex: 1, fontWeight: 'bold' }}>
                                Recording... {formatDuration(recordingDuration)}
                            </Text>
                            <TouchableOpacity onPress={() => stopRecording(true)} style={{ padding: 10 }}>
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => stopRecording(false)} style={styles.sendRecordingBtn}>
                                <Ionicons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.attachBtn} onPress={() => handleFileUpload('document')}>
                                <Ionicons name="attach" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachBtn} onPress={() => handleFileUpload('image')}>
                                <Ionicons name="image" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.surface }]}
                                placeholder="Type a message..."
                                placeholderTextColor={colors.textSecondary}
                                value={inputText}
                                onChangeText={handleTextInput}
                                multiline
                            />
                            {uploading ? (
                                <View style={styles.sendBtn}>
                                    <ActivityIndicator size="small" color={colors.tint} />
                                </View>
                            ) : inputText.trim() || selectedFile ? (
                                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.buttonBackground }]} onPress={handleSend}>
                                    <Ionicons name="send" size={20} color={colors.buttonText} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.sendBtn, { backgroundColor: colors.surface }]}
                                    onPressIn={startRecording}
                                    onPressOut={() => stopRecording(false)}
                                >
                                    <Ionicons name="mic" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 60,
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
        fontSize: 12,
        fontStyle: 'italic',
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    messageList: { padding: 10 },
    messageBox: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    myMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    messageText: { fontSize: 16 },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 5,
    },
    messageTime: { fontSize: 10 },
    inputArea: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        borderTopWidth: 1,
    },
    attachBtn: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 16,
        borderWidth: 1,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        elevation: 3,
    },
    imageWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 2,
    },
    documentWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 6,
    },
    audioWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 6,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 5,
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 10,
        borderRadius: 10,
        marginBottom: 5,
        maxWidth: 200,
    },
    documentName: {
        marginLeft: 10,
        fontSize: 14,
        flexShrink: 1,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        minWidth: 120,
    },
    playPauseBtn: {
        marginRight: 10,
    },
    audioDuration: {
        fontSize: 14,
        fontWeight: '500',
    },
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    sendRecordingBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    previewContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderBottomWidth: 0,
    },
    previewClose: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 10,
    },
    previewImageThumb: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    previewDocument: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        maxWidth: '80%',
    },
    previewDocumentText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
        flexShrink: 1,
    },
    callLogContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    callLogBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    callLogIcon: {
        marginRight: 10,
    },
    callLogText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    callLogSubtext: {
        fontSize: 11,
    },
});
