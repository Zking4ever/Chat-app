import * as Contacts from 'expo-contacts';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI, contactAPI } from '../../lib/api';
import { useAuth } from '@/context/AuthContext';

import { useTheme } from '@/context/ThemeContext';

export default function ContactsScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [contacts, setContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();

    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
                });

                if (data.length > 0) {
                    const phones = data
                        .flatMap(c => c.phoneNumbers || [])
                        .map(p => p.number?.replace(/[^0-9+]/g, ''))
                        .filter(Boolean);

                    try {
                        const response = await contactAPI.detect(phones as string[]);
                        const registered = response.data;

                        const processed = data.map(c => {
                            const phone = c.phoneNumbers?.[0]?.number?.replace(/[^0-9+]/g, '');
                            const reg = registered.find((r: any) => r.phone === phone);
                            return {
                                ...c,
                                registeredUser: reg,
                                isRegistered: !!reg
                            };
                        }).sort((a, b) => (b.isRegistered ? 1 : 0) - (a.isRegistered ? 1 : 0));

                        setContacts(processed as any);
                    } catch (error) {
                        console.error('Detection failed', error);
                    }
                }
            }
            setLoading(false);
        })();
    }, []);

    const filteredContacts = useMemo(() => {
        return contacts.filter((c: any) => {
            const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
            const phone = c.phoneNumbers?.[0]?.number || '';
            const query = searchQuery.toLowerCase();
            return fullName.includes(query) || phone.includes(query);
        });
    }, [contacts, searchQuery]);

    const handleStartChat = async (contact: any) => {
        if (!contact.isRegistered) {
            Alert.alert('Invite', `Invite ${contact.firstName} to ABA?`);
            return;
        }

        try {
            const response = await chatAPI.getOrCreateConvo(user.id, contact.registeredUser.id);
            navigation.navigate('Chat' as never, { convoId: response.data.conversation_id } as never);
        } catch (error) {
            Alert.alert('Error', 'Failed to start chat');
        }
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.contactItem, { borderBottomColor: colors.surface }]}
            onPress={() => handleStartChat(item)}
        >
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>{item.firstName?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.contactDetails}>
                <Text style={[styles.contactName, { color: colors.text }]}>{item.firstName} {item.lastName}</Text>
                <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{item.phoneNumbers?.[0]?.number || 'No number'}</Text>
            </View>
            {item.isRegistered ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.statusText, { color: colors.tint }]}>ABA User</Text>
                </View>
            ) : (
                <Text style={[styles.inviteText, { color: colors.tint }]}>Invite to ABA</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.headerText} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.headerText }]}>Select Contact</Text>
            </View>

            <View style={[styles.searchBarContainer, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search name or number"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading contacts...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No contacts found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    searchBarContainer: {
        padding: 10,
        borderBottomWidth: 0.5,
    },
    searchBar: {
        flexDirection: 'row',
        borderRadius: 25,
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 45
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16 },
    contactItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 0.5,
        alignItems: 'center'
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    contactDetails: { flex: 1 },
    contactName: { fontSize: 17, fontWeight: '600' },
    contactPhone: { fontSize: 14, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15
    },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    inviteText: { fontWeight: 'bold', fontSize: 14 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    loadingText: { marginTop: 10 },
    emptyText: { fontSize: 16 }
});

