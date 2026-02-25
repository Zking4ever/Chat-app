import * as Contacts from 'expo-contacts';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI, contactAPI } from '../../lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ContactsScreen() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

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
            style={styles.contactItem}
            onPress={() => handleStartChat(item)}
        >
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.firstName?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.contactPhone}>{item.phoneNumbers?.[0]?.number || 'No number'}</Text>
            </View>
            {item.isRegistered ? (
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>ABA User</Text>
                </View>
            ) : (
                <Text style={styles.inviteText}>Invite to ABA</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Contact</Text>
            </View>

            <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search name or number"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#888"
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#075E54" />
                    <Text style={styles.loadingText}>Loading contacts...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No contacts found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        height: 60,
        backgroundColor: '#075E54',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15
    },
    backBtn: { marginRight: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    searchBarContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee'
    },
    searchBar: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 45
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#000' },
    contactItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center'
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#075E5420',
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        color: '#075E54',
        fontSize: 20,
        fontWeight: 'bold'
    },
    contactDetails: { flex: 1 },
    contactName: { fontSize: 17, fontWeight: '600', color: '#000' },
    contactPhone: { fontSize: 14, color: '#666', marginTop: 2 },
    statusBadge: {
        backgroundColor: '#E7FCE3',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15
    },
    statusText: { color: '#075E54', fontSize: 12, fontWeight: 'bold' },
    inviteText: { color: '#075E54', fontWeight: 'bold', fontSize: 14 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    loadingText: { marginTop: 10, color: '#666' },
    emptyText: { color: '#888', fontSize: 16 }
});

