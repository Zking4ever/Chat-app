import { useNavigation } from 'expo-router';
import React, { use, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatAPI } from '../../lib/api';
import { useAuth } from '@/context/AuthContext';
import SocketService from '@/src/services/SocketService';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Home() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const navigation = useNavigation<any>();
  const router = useRouter();

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
      style={[styles.convoItem, { borderBottomColor: colors.surface }]}
      onPress={() => navigation.navigate('Chat' as any, {
        convoId: item.id,
        participantId: item.participant_id,
        participantName: item.participant_name || `Chat #${item.id}`
      })}
    >
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
        {item.is_online && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.convoDetails}>
        <View style={styles.convoHeader}>
          <Text style={[styles.convoName, { color: colors.text }]}>{item.name || `Chat #${item.id}`}</Text>
          <Text style={[styles.convoTime, { color: colors.textSecondary }]}>
            {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, { color: colors.textSecondary }, typingUsers[item.id] && styles.typingText]}
          numberOfLines={1}
        >
          {typingUsers[item.id] ? 'Typing...' : (item.last_message || 'No messages yet')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>ABA</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('/(root)/Search')} style={styles.headerIcon}>
            <Ionicons name="search-outline" size={24} color={colors.headerText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(root)/Settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>No conversations yet. Start chatting!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.buttonBackground }]}
        onPress={() => navigation.navigate('Contacts' as never)}
      >
        <Text style={[styles.fabText, { color: colors.buttonText }]}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerIcon: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  convoItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
