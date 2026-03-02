import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    SafeAreaView, Switch, Platform, TextInput, Image,
    ActivityIndicator, Alert, Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'self';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { theme, colors, toggleTheme } = useTheme();
    const { logout, user, setUser } = useAuth();
    const router = useRouter();

    const isDarkMode = theme === 'dark';
    const currentLanguage = i18n.language;

    // Profile edit state
    const [editVisible, setEditVisible] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [username, setUsername] = useState(user.username || '');
    const [profilePic, setProfilePic] = useState(user.profile_picture || '');
    const [saving, setSaving] = useState(false);

    // Username availability
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!editVisible) return;

        // Clear previous timer
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = username.trim().toLowerCase();

        if (!trimmed) {
            setUsernameStatus('idle');
            return;
        }

        // If the user hasn't changed their username, skip check
        if (trimmed === (user.username || '').toLowerCase()) {
            setUsernameStatus('self');
            return;
        }

        setUsernameStatus('checking');
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await userAPI.checkUsername(trimmed, user.id);
                setUsernameStatus(res.data.available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [username, editVisible]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: false,
        });
        if (!result.canceled && result.assets[0]) {
            setProfilePic(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (usernameStatus === 'taken' || usernameStatus === 'checking') return;
        setSaving(true);
        try {
            let picData: string | undefined = profilePic || undefined;

            // Convert local file URI → base64 data URL so the backend can save it
            if (
                profilePic &&
                (profilePic.startsWith('file://') || profilePic.startsWith('content://'))
            ) {
                const base64 = await FileSystem.readAsStringAsync(profilePic, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                picData = `data:image/jpeg;base64,${base64}`;
            }

            const response = await userAPI.updateProfile(user.id, {
                name: name.trim() || undefined,
                username: username.trim() || undefined,
                profile_picture: picData,
            });
            const updatedUser = { ...user, ...response.data };
            await setUser(updatedUser);
            setEditVisible(false);
        } catch (error: any) {
            const msg =
                error?.response?.data?.error || 'Failed to update profile. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const openEdit = () => {
        setName(user.name || '');
        setUsername(user.username || '');
        setProfilePic(user.profile_picture || '');
        setUsernameStatus('idle');
        setEditVisible(true);
    };

    // ── Derived border / message for username field ──────────────────────────
    const usernameBorderColor =
        usernameStatus === 'available' ? '#22c55e'
            : usernameStatus === 'taken' ? '#ef4444'
                : colors.surface;

    const usernameStatusNode = (() => {
        switch (usernameStatus) {
            case 'checking':
                return (
                    <View style={styles.statusRow}>
                        <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginRight: 5 }} />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>Checking…</Text>
                    </View>
                );
            case 'available':
                return (
                    <View style={styles.statusRow}>
                        <Ionicons name="checkmark-circle" size={14} color="#22c55e" style={{ marginRight: 4 }} />
                        <Text style={[styles.statusText, { color: '#22c55e' }]}>Available</Text>
                    </View>
                );
            case 'taken':
                return (
                    <View style={styles.statusRow}>
                        <Ionicons name="close-circle" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                        <Text style={[styles.statusText, { color: '#ef4444' }]}>Already taken</Text>
                    </View>
                );
            default:
                return null;
        }
    })();

    const isSaveDisabled = saving || usernameStatus === 'taken' || usernameStatus === 'checking';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.headerText} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.headerText }]}>{t('settings.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* ── Profile Section ─────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>Profile</Text>
                    <TouchableOpacity
                        style={[styles.profileRow, { backgroundColor: colors.surface }]}
                        onPress={openEdit}
                        activeOpacity={0.75}
                    >
                        <View style={styles.avatarWrapper}>
                            {user.profile_picture ? (
                                <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarFallback, { backgroundColor: colors.tint }]}>
                                    <Text style={styles.avatarInitial}>
                                        {(user.name || user.username || '?')[0].toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.editBadge, { backgroundColor: colors.tint }]}>
                                <Ionicons name="pencil" size={10} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.text }]}>
                                {user.name || 'No name set'}
                            </Text>
                            <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
                                {user.username ? `@${user.username}` : 'No username set'}
                            </Text>
                            <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                                {user.phone}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* ── Theme ─────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>{t('settings.theme')}</Text>
                    <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={22} color={colors.tint} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {isDarkMode ? t('settings.dark') : t('settings.light')}
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.tint }}
                            thumbColor={Platform.OS === 'ios' ? '#fff' : isDarkMode ? colors.tint : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* ── Language ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>{t('settings.language')}</Text>
                    <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.langOption, currentLanguage === 'en' && styles.activeLangOption]}
                            onPress={() => i18n.changeLanguage('en')}
                        >
                            <Text style={[styles.langText, { color: currentLanguage === 'en' ? colors.tint : colors.text }]}>EN</Text>
                            {currentLanguage === 'en' && <Ionicons name="checkmark" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                        <View style={styles.separator} />
                        <TouchableOpacity
                            style={[styles.langOption, currentLanguage === 'am' && styles.activeLangOption]}
                            onPress={() => i18n.changeLanguage('am')}
                        >
                            <Text style={[styles.langText, { color: currentLanguage === 'am' ? colors.tint : colors.text }]}>አማ</Text>
                            {currentLanguage === 'am' && <Ionicons name="checkmark" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── About ─────────────────────────────────────────── */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.surface }]}
                        onPress={() => router.push('/(root)/About')}
                    >
                        <View style={styles.settingInfo}>
                            <Ionicons name="information-circle-outline" size={22} color={colors.tint} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.about')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* ── Logout ────────────────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: colors.tint }]}
                    onPress={logout}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.tint} />
                    <Text style={[styles.logoutText, { color: colors.tint }]}>{t('settings.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ── Edit Profile Modal ──────────────────────────────── */}
            <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.surface }]}>
                        <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalCancel}>
                            <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                        <TouchableOpacity
                            onPress={handleSave}
                            style={[styles.modalSave, isSaveDisabled && { opacity: 0.4 }]}
                            disabled={isSaveDisabled}
                        >
                            {saving
                                ? <ActivityIndicator size="small" color={colors.tint} />
                                : <Text style={[styles.modalSaveText, { color: colors.tint }]}>Save</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody}>
                        {/* Avatar picker */}
                        <TouchableOpacity onPress={pickImage} style={styles.avatarPickerWrapper}>
                            {profilePic ? (
                                <Image source={{ uri: profilePic }} style={styles.avatarLarge} />
                            ) : (
                                <View style={[styles.avatarLargeFallback, { backgroundColor: colors.tint }]}>
                                    <Text style={styles.avatarLargeInitial}>
                                        {(name || username || '?')[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.avatarPickerBadge, { backgroundColor: colors.tint }]}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.avatarPickerHint, { color: colors.textSecondary }]}>
                            Tap to change photo
                        </Text>

                        {/* Name */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Display Name</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.surface }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            placeholderTextColor={colors.textSecondary}
                        />

                        {/* Username */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
                        <View style={[
                            styles.usernameRow,
                            { backgroundColor: colors.surface, borderColor: usernameBorderColor },
                            usernameStatus === 'available' && styles.usernameRowAvailable,
                            usernameStatus === 'taken' && styles.usernameRowTaken,
                        ]}>
                            <Text style={[styles.atSign, { color: colors.textSecondary }]}>@</Text>
                            <TextInput
                                style={[styles.usernameInput, { color: colors.text }]}
                                value={username}
                                onChangeText={(t) => setUsername(t.replace(/[^a-z0-9_.]/gi, '').toLowerCase())}
                                placeholder="username"
                                placeholderTextColor={colors.textSecondary}
                                autoCapitalize="none"
                            />
                            {usernameStatus === 'checking' && (
                                <ActivityIndicator size="small" color={colors.textSecondary} />
                            )}
                            {usernameStatus === 'available' && (
                                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                            )}
                            {usernameStatus === 'taken' && (
                                <Ionicons name="close-circle" size={18} color="#ef4444" />
                            )}
                        </View>
                        {/* Status message below the username row */}
                        {usernameStatusNode}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 60, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 15, elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    backButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    section: { marginBottom: 25 },
    sectionTitle: {
        fontSize: 12, fontWeight: 'bold', marginBottom: 10,
        marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1,
    },

    // Profile row
    profileRow: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        borderRadius: 15, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2,
    },
    avatarWrapper: { position: 'relative', marginRight: 15 },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarFallback: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 18, height: 18, borderRadius: 9,
        justifyContent: 'center', alignItems: 'center',
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: 'bold' },
    profileUsername: { fontSize: 14, marginTop: 2 },
    profilePhone: { fontSize: 12, marginTop: 2 },

    // Generic setting row
    settingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 15, borderRadius: 15, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2,
    },
    settingInfo: { flexDirection: 'row', alignItems: 'center' },
    settingLabel: { fontSize: 16, marginLeft: 12, fontWeight: '500' },

    // Language
    langOption: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 10,
    },
    activeLangOption: { backgroundColor: 'rgba(0,0,0,0.02)' },
    langText: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
    separator: { width: 1, height: '60%', backgroundColor: 'rgba(0,0,0,0.1)' },

    // Logout
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 20, padding: 15, borderRadius: 15, borderWidth: 1,
    },
    logoutText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

    // Modal
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    modalCancel: { width: 70 },
    modalCancelText: { fontSize: 16 },
    modalTitle: { fontSize: 17, fontWeight: '600' },
    modalSave: { width: 70, alignItems: 'flex-end' },
    modalSaveText: { fontSize: 16, fontWeight: '700' },
    modalBody: { padding: 24, alignItems: 'center' },

    // Avatar picker
    avatarPickerWrapper: { position: 'relative', marginBottom: 6 },
    avatarLarge: { width: 96, height: 96, borderRadius: 48 },
    avatarLargeFallback: {
        width: 96, height: 96, borderRadius: 48,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarLargeInitial: { color: '#fff', fontSize: 38, fontWeight: 'bold' },
    avatarPickerBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    avatarPickerHint: { fontSize: 13, marginBottom: 28 },

    // Fields
    fieldLabel: {
        alignSelf: 'flex-start', fontSize: 13, fontWeight: '600',
        marginBottom: 6, marginLeft: 4,
    },
    fieldInput: {
        width: '100%', borderRadius: 12, paddingHorizontal: 15,
        paddingVertical: 13, fontSize: 16, borderWidth: 1, marginBottom: 20,
    },
    usernameRow: {
        width: '100%', flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, paddingHorizontal: 15, borderWidth: 1.5, marginBottom: 6,
    },
    usernameRowAvailable: { borderColor: '#22c55e' },
    usernameRowTaken: { borderColor: '#ef4444' },
    atSign: { fontSize: 18, marginRight: 4 },
    usernameInput: { flex: 1, paddingVertical: 13, fontSize: 16, outlineWidth: 0, outlineColor: 'transparent', marginVertical: 2 },

    // Username status
    statusRow: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start', marginBottom: 20, marginLeft: 4,
    },
    statusText: { fontSize: 12, fontWeight: '500' },
});
