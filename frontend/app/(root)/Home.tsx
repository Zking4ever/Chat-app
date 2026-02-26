import { useNavigation } from 'expo-router';
import React, { use, useEffect, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import SocketService from '@/src/services/SocketService';

// Dummy user ID for development - in real app, get from storage/auth


export default function Home() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const navigation = useNavigation();

  const fetchConversations = async (id: number) => {
    try {
      const response = await chatAPI.getConversations(id);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchConversations(user.id);

    const socket = SocketService.getSocket(user.id);

    const handleStatusChange = ({ user_id, is_online }: any) => {
      setConversations((prev: any) =>
        prev.map((c: any) =>
          c.participant_id === user_id ? { ...c, is_online } : c
        )
      );
    };

    const handleMessage = (msg: any) => {
      setConversations((prev: any) => {
        const index = prev.findIndex((c: any) => c.id === msg.convo_id);
        if (index === -1) {
          fetchConversations(user.id);
          return prev;
        }
        const updatedConvo = {
          ...prev[index],
          last_message: msg.content,
          last_message_time: msg.created_at
        };
        const newList = [...prev];
        newList.splice(index, 1);
        return [updatedConvo, ...newList];
      });
    };

    const handleTypingStatus = ({ convoId, isTyping }: any) => {
      setTypingUsers(prev => ({ ...prev, [convoId]: isTyping }));
    };

    socket.on('user_status_changed', handleStatusChange);
    socket.on('message', handleMessage);
    socket.on('typing_status', handleTypingStatus);

    return () => {
      socket.off('user_status_changed', handleStatusChange);
      socket.off('message', handleMessage);
      socket.off('typing_status', handleTypingStatus);
    };
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    await fetchConversations(user.id);
    setRefreshing(false);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.convoItem}
      onPress={() => navigation.navigate('Chat' as any, {
        convoId: item.id,
        participantId: item.participant_id,
        participantName: item.participant_name || `Chat #${item.id}`
      })}
    >
      <View style={styles.avatarPlaceholder}>
        {item.is_online && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.convoDetails}>
        <View style={styles.convoHeader}>
          <Text style={styles.convoName}>{item.name || `Chat #${item.id}`}</Text>
          <Text style={styles.convoTime}>
            {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, typingUsers[item.id] && styles.typingText]}
          numberOfLines={1}
        >
          {typingUsers[item.id] ? 'Typing...' : (item.last_message || 'No messages yet')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ABA</Text>
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
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#44b700',
    borderWidth: 2,
    borderColor: '#fff',
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
  typingText: {
    color: '#25D366',
    fontStyle: 'italic',
    fontWeight: '500',
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
