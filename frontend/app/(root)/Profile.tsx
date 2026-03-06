import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
    const { userId } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark';
    const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

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
        <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Profile</Text>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.imageContainer}>
                    {user.profile_picture ? (
                        <Image source={{ uri: `${API_BASE_URL}${user.profile_picture}` }} style={styles.profileImage} />
                    ) : (
                        <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#333' : '#ddd' }]}>
                            <Ionicons name="person" size={80} color={isDark ? '#666' : '#999'} />
                        </View>
                    )}
                    {user.is_online && <View style={styles.onlineBadge} />}
                </View>

                <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>{user.name}</Text>
                <Text style={[styles.username, { color: isDark ? '#aaa' : '#666' }]}>@{user.username}</Text>

                <Text style={[styles.statusText, { color: user.is_online ? '#25D366' : (isDark ? '#aaa' : '#666') }]}>
                    {user.is_online ? 'Online' : user.last_seen ? `Last seen ${new Date(user.last_seen).toLocaleString()}` : 'Offline'}
                </Text>
            </View>

            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                    onPress={() => router.push({ pathname: '/(root)/Chat', params: { convoId: 'new', participantId: user.id } })}
                >
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>

                <View style={styles.callActions}>
                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: isDark ? '#333' : '#fff' }]}
                        onPress={() => router.push({ pathname: '/(root)/Call', params: { participantId: user.id, callType: 'audio' } })}
                    >
                        <Ionicons name="call" size={20} color="#25D366" />
                        <Text style={[styles.callButtonText, { color: isDark ? '#fff' : '#000' }]}>Audio</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: isDark ? '#333' : '#fff' }]}
                        onPress={() => router.push({ pathname: '/(root)/Call', params: { participantId: user.id, callType: 'video' } })}
                    >
                        <Ionicons name="videocam" size={20} color="#25D366" />
                        <Text style={[styles.callButtonText, { color: isDark ? '#fff' : '#000' }]}>Video</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
    backButton: { marginRight: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    profileSection: { alignItems: 'center', paddingVertical: 40 },
    imageContainer: { position: 'relative', marginBottom: 20 },
    profileImage: { width: 150, height: 150, borderRadius: 75 },
    placeholderImage: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center' },
    onlineBadge: { position: 'absolute', bottom: 10, right: 10, width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#25D366', borderWidth: 4, borderColor: '#fff' },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    username: { fontSize: 16, marginBottom: 10 },
    statusText: { fontSize: 14 },
    actionSection: { padding: 20 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, marginBottom: 15 },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    callActions: { flexDirection: 'row', gap: 15 },
    callButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
    callButtonText: { fontSize: 16, fontWeight: '500', marginLeft: 10 }
});
