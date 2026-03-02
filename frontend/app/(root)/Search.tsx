import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    TouchableOpacity, Image, ActivityIndicator, SafeAreaView,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { userAPI, chatAPI } from '@/lib/api';
import { StorageService } from '@/src/services/StorageService';
import { UserInter } from '@/constants/types';
import { getImageUrl } from '@/lib/imageUrl';

export default function Search() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [openingChat, setOpeningChat] = useState<number | null>(null);

    // Recent contacts
    const [recentContacts, setRecentContacts] = useState<UserInter[]>([]);

    // Load recent contacts on mount
    useEffect(() => {
        StorageService.getRecentContacts().then(setRecentContacts);
    }, []);

    const handleSearch = useCallback(async (text: string) => {
        setQuery(text);
        if (text.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        try {
            const res = await userAPI.searchUsers(text.trim());
            setResults((res.data || []).filter((u: any) => u.id !== user.id));
            setSearched(true);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    const openChat = async (targetUser: any) => {
        setOpeningChat(targetUser.id);
        try {
            const res = await chatAPI.getOrCreateConvo(user.id, targetUser.id);
            const convoId = res.data.id;

            // Save to recent contacts
            await StorageService.addRecentContact(targetUser as UserInter);
            setRecentContacts(await StorageService.getRecentContacts());

            router.push({
                pathname: '/(root)/Chat',
                params: {
                    convoId: String(convoId),
                    participantId: String(targetUser.id),
                    participantName: targetUser.name || targetUser.username || `User #${targetUser.id}`,
                }
            } as any);
        } catch (error) {
            console.error('Failed to open chat:', error);
        } finally {
            setOpeningChat(null);
        }
    };

    const removeRecent = async (contactId: number) => {
        await StorageService.removeRecentContact(contactId);
        setRecentContacts(await StorageService.getRecentContacts());
    };

    const renderItem = ({ item, isRecent = false }: { item: any; isRecent?: boolean }) => (
        <AnimatedContactRow
            item={item}
            isRecent={isRecent}
            openingChat={openingChat}
            colors={colors}
            onPress={() => openChat(item)}
            onLongPress={isRecent ? () => removeRecent(item.id) : undefined}
        />
    );

    const showRecents = query.length === 0 && recentContacts.length > 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.headerText} />
                </TouchableOpacity>
                <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by name or @username…"
                        placeholderTextColor={colors.textSecondary}
                        value={query}
                        onChangeText={handleSearch}
                        autoFocus
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : showRecents ? (
                /* ── Recent Contacts ── */
                <FlatList
                    data={recentContacts}
                    keyExtractor={(item) => `recent_${item.id}`}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Recent</Text>
                            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                                Hold to remove
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => renderItem({ item, isRecent: true })}
                />
            ) : (
                /* ── Search Results ── */
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => renderItem({ item, isRecent: false })}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        searched ? (
                            <View style={styles.center}>
                                <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No users found
                                </Text>
                            </View>
                        ) : query.length === 0 ? (
                            <View style={styles.center}>
                                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Search for people to chat with
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

// ── Animated row with long-press fade-out ────────────────────────────────────
function AnimatedContactRow({
    item, isRecent, openingChat, colors, onPress, onLongPress,
}: {
    item: any;
    isRecent: boolean;
    openingChat: number | null;
    colors: any;
    onPress: () => void;
    onLongPress?: () => void;
}) {
    const opacity = useRef(new Animated.Value(1)).current;

    const handleLongPress = () => {
        if (!onLongPress) return;
        Animated.sequence([
            Animated.timing(opacity, { toValue: 0.2, duration: 120, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => onLongPress());
    };

    return (
        <Animated.View style={{ opacity }}>
            <TouchableOpacity
                style={[styles.resultRow, { backgroundColor: colors.surface }]}
                onPress={onPress}
                onLongPress={handleLongPress}
                delayLongPress={500}
                activeOpacity={0.7}
            >
                {getImageUrl(item.profile_picture) ? (
                    <Image source={{ uri: getImageUrl(item.profile_picture) }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: colors.tint }]}>
                        <Text style={styles.avatarInitial}>
                            {(item.name || item.username || '?')[0].toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                        {item.name || 'Unknown'}
                    </Text>
                    {item.username ? (
                        <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
                            @{item.username}
                        </Text>
                    ) : null}
                </View>
                {openingChat === item.id ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                ) : isRecent ? (
                    <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                ) : (
                    <Ionicons name="chatbubble-outline" size={20} color={colors.tint} />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    backBtn: { marginRight: 10 },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        borderRadius: 25, paddingHorizontal: 12, height: 44,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    listContent: { padding: 12 },

    // Section header for "Recent"
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, paddingHorizontal: 4,
    },
    sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    sectionHint: { fontSize: 11 },

    resultRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 15, marginBottom: 10,
        elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2,
    },
    avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 14 },
    avatarFallback: {
        width: 48, height: 48, borderRadius: 24, marginRight: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600' },
    userHandle: { fontSize: 14, marginTop: 2 },
    center: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingTop: 80, gap: 12,
    },
    emptyText: { fontSize: 15, textAlign: 'center' },
});
