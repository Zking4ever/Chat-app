import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { chatAPI } from '../../lib/api';

// Dummy user ID for development - in real app, get from storage/auth
const CURRENT_USER_ID = 1;

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations(CURRENT_USER_ID);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.convoItem}
      onPress={() => navigation.navigate('Chat' as never, { convoId: item.id } as never)}
    >
      <View style={styles.avatarPlaceholder} />
      <View style={styles.convoDetails}>
        <View style={styles.convoHeader}>
          <Text style={styles.convoName}>{item.name || `Chat #${item.id}`}</Text>
          <Text style={styles.convoTime}>
            {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatsApp</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No conversations yet. Start chatting!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Contacts' as never)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  convoItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    marginRight: 15,
  },
  convoDetails: {
    flex: 1,
  },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  convoName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  convoTime: {
    fontSize: 12,
    color: '#888',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
