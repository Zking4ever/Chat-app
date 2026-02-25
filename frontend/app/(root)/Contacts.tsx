import * as Contacts from 'expo-contacts';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { chatAPI, contactAPI } from '../../lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ContactsScreen() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
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
                        // Check registered contacts
                        const response = await contactAPI.detect(phones as string[]);
                        const registered = response.data;

                        // Merge status
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
                        console.log(processed);
                    } catch (error) {
                        console.error('Detection failed', error);
                    }
                }
            }
            setLoading(false);
        })();
    }, []);

    const handleStartChat = async (contact: any) => {
        if (!contact.isRegistered) {
            Alert.alert('Invite', `Invite ${contact.firstName} to WhatsApp?`);
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
            <View style={styles.avatarPlaceholder} />
            <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.contactPhone}>{item.phoneNumbers?.[0]?.number}</Text>
            </View>
            {item.isRegistered ? (
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Registered</Text>
                </View>
            ) : (
                <Text style={styles.inviteText}>Invite</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Contact</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Text>Loading contacts...</Text>
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { height: 60, backgroundColor: '#075E54', justifyContent: 'center', paddingHorizontal: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    contactItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee', alignItems: 'center' },
    avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#ccc', marginRight: 15 },
    contactDetails: { flex: 1 },
    contactName: { fontSize: 16, fontWeight: 'bold' },
    contactPhone: { fontSize: 14, color: '#666' },
    statusBadge: { backgroundColor: '#E7FCE3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { color: '#075E54', fontSize: 12, fontWeight: 'bold' },
    inviteText: { color: '#25D366', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
