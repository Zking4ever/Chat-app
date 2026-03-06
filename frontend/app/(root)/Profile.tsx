import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { userId } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark';
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`);
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchUser();
    }, [userId]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }, styles.centered]}>
                <ActivityIndicator size="large" color="#25D366" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }, styles.centered]}>
                <Text style={{ color: isDark ? '#fff' : '#000' }}>User not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]} bounces={false}>
            {/* Header / Background Image Section */}
            <View style={styles.imageHeader}>
                {user.profile_picture ? (
                    <Image
                        source={{ uri: `${API_BASE_URL}${user.profile_picture}` }}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.placeholderHeader, { backgroundColor: isDark ? '#2c3e50' : '#3498db' }]}>
                        <Ionicons name="person" size={120} color="rgba(255,255,255,0.4)" />
                    </View>
                )}

                {/* Top Controls */}
                <View style={styles.topControls}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Overlay with Name and Blur */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                >
                    <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
                        <View style={styles.nameContainer}>
                            <View>
                                <Text style={styles.nameText}>{user.name}</Text>
                                <Text style={styles.statusTextOverlay}>
                                    {user.is_online ? 'online' : `last seen ${new Date(user.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </Text>
                            </View>
                            {user.is_online && <View style={styles.onlineDot} />}
                        </View>
                    </BlurView>
                </LinearGradient>
            </View>

            {/* Info Section */}
            <View style={[styles.infoCard, { backgroundColor: isDark ? '#1c1c1c' : '#fff' }]}>
                <View style={styles.infoRow}>
                    <Ionicons name="at" size={22} color="#25D366" style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: isDark ? '#aaa' : '#666' }]}>Username</Text>
                        <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>@{user.username}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoRow}>
                    <Ionicons name="information-circle-outline" size={22} color="#25D366" style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: isDark ? '#aaa' : '#666' }]}>Bio</Text>
                        <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                            {user.bio || "No bio yet"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Action Section */}
            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={[styles.primaryActionButton, { backgroundColor: '#25D366' }]}
                    onPress={() => router.push({ pathname: '/(root)/Chat', params: { convoId: 'new', participantId: user.id, participantName: user.name } })}
                >
                    <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    <Text style={styles.actionButtonText}>Send Message</Text>
                </TouchableOpacity>

                <View style={styles.callGrid}>
                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: isDark ? '#2c2c2c' : '#fff' }]}
                        onPress={() => router.push({ pathname: '/(root)/Call', params: { participantId: user.id, callType: 'audio', fromName: user.name } })}
                    >
                        <Ionicons name="call" size={20} color="#25D366" />
                        <Text style={[styles.callButtonText, { color: isDark ? '#fff' : '#000' }]}>Audio Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: isDark ? '#2c2c2c' : '#fff' }]}
                        onPress={() => router.push({ pathname: '/(root)/Call', params: { participantId: user.id, callType: 'video', fromName: user.name } })}
                    >
                        <Ionicons name="videocam" size={20} color="#25D366" />
                        <Text style={[styles.callButtonText, { color: isDark ? '#fff' : '#000' }]}>Video Call</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    imageHeader: {
        width: '100%',
        height: width * 1.1,
        position: 'relative',
        backgroundColor: '#000',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    placeholderHeader: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topControls: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        zIndex: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        justifyContent: 'flex-end',
    },
    blurContainer: {
        padding: 20,
        margin: 15,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    statusTextOverlay: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 2,
    },
    onlineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#25D366',
        borderWidth: 2,
        borderColor: '#fff',
    },
    infoCard: {
        margin: 15,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    infoIcon: {
        width: 40,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(150,150,150,0.1)',
        marginVertical: 10,
        marginLeft: 40,
    },
    actionSection: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    primaryActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        marginBottom: 15,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    callGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
    },
    callButtonText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    }
});
