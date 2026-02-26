import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface CallNotificationProps {
    visible: boolean;
    callerName: string;
    callType: 'audio' | 'video';
    onAnswer: () => void;
    onDecline: () => void;
    onNotificationPress?: () => void;
}

export default function CallNotification({
    visible,
    callerName,
    callType,
    onAnswer,
    onDecline,
    onNotificationPress
}: CallNotificationProps) {
    const translateY = React.useRef(new Animated.Value(-200)).current;

    const [shouldRender, setShouldRender] = React.useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 40,
                friction: 7
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: -200,
                duration: 300,
                useNativeDriver: true
            }).start(() => setShouldRender(false));
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
            <BlurView intensity={80} style={styles.blurContainer} tint="dark">
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.info}
                        onPress={onNotificationPress}
                        activeOpacity={0.7}
                    >
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={24} color="#fff" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.callerName}>{callerName}</Text>
                            <Text style={styles.callType}>
                                Incoming {callType} call...
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={onDecline}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.answerButton]}
                            onPress={onAnswer}
                        >
                            <Ionicons name="call" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 20,
        right: 20,
        zIndex: 1000,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    blurContainer: {
        padding: 15,
        borderRadius: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#075E54',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    callerName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    callType: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
    },
    button: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#FF3B30',
    },
    answerButton: {
        backgroundColor: '#25D366',
    },
});
