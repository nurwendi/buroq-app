import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TicketDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticketId = route.params?.ticketId;
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Track keyboard height using Keyboard API
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchTicketDetails = async () => {
    try {
      const ticketRes = await apiClient.get(`/api/tickets`);
      if (ticketId && Array.isArray(ticketRes.data)) {
        const found = ticketRes.data.find((t: any) => t.id === ticketId);
        if (found) setTicket(found);
      }
    } catch (e) {
      console.error('Failed to fetch ticket details:', e);
    }
  };

  const fetchMessages = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await apiClient.get(`/api/tickets/${ticketId}/messages`);
      if (Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    fetchMessages();
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ticketId]);

  const handleSendMessage = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/api/tickets/${ticketId}/messages`, {
        message: replyText,
      });
      setReplyText('');
      await fetchMessages(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menutup tiket komplain ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tutup',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.patch(`/api/tickets/${ticketId}`, { status: 'closed' });
              Alert.alert('Sukses', 'Tiket berhasil ditutup.');
              fetchTicketDetails();
              fetchMessages(true);
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error || 'Gagal menutup tiket.');
            }
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Baru';
      case 'in_progress': return 'Diproses';
      case 'resolved': return 'Selesai';
      case 'closed': return 'Tutup';
      default: return status;
    }
  };

  // Footer height: 64px bar + bottom inset
  const FOOTER_HEIGHT = 64 + insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <GradientHeader
        title={ticket ? ticket.ticketId : 'Memuat...'}
        onBackPress={() => navigation.goBack()}
      />

      {loading && !ticket ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Ticket Info Card */}
          {ticket && (
            <View style={styles.ticketInfoCard}>
              <View style={styles.ticketHeaderRow}>
                <Text style={styles.ticketTitle}>{ticket.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: ticket.status === 'closed' ? '#f1f5f9' : '#eff6ff' }]}>
                  <Text style={[styles.statusText, { color: ticket.status === 'closed' ? '#64748b' : '#2563eb' }]}>
                    {getStatusLabel(ticket.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketDesc}>
                <Text style={{ fontWeight: '700' }}>Deskripsi: </Text>
                {ticket.description}
              </Text>

              {user?.role === 'customer' && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <TouchableOpacity style={styles.closeTicketBtn} onPress={handleCloseTicket}>
                  <Text style={styles.closeTicketText}>Selesaikan & Tutup Tiket</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Messages FlatList — padded bottom to not be hidden under input */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: FOOTER_HEIGHT + keyboardHeight + 8 },
            ]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isMe =
                (item.senderType === 'customer' && user?.role === 'customer') ||
                (item.senderType !== 'customer' && user?.role !== 'customer');
              const isSystem = item.senderType === 'system';

              if (isSystem) {
                return (
                  <View style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{item.message}</Text>
                  </View>
                );
              }

              return (
                <View style={[styles.messageWrapper, isMe ? styles.messageMe : styles.messageOther]}>
                  <Text style={styles.senderName}>{item.senderName}</Text>
                  <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
                      {item.message}
                    </Text>
                  </View>
                  <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
                </View>
              );
            }}
          />

          {/* Floating Input Bar — positioned above keyboard */}
          {ticket && ticket.status !== 'closed' && ticket.status !== 'resolved' ? (
            <View
              style={[
                styles.footerInputRow,
                {
                  bottom: keyboardHeight + insets.bottom,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Tulis balasan..."
                value={replyText}
                onChangeText={setReplyText}
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!replyText.trim() || sending) && { opacity: 0.5 }]}
                onPress={handleSendMessage}
                disabled={sending || !replyText.trim()}
              >
                {sending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Send size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.closedBanner, { bottom: insets.bottom }]}>
              <Text style={styles.closedBannerText}>Percakapan ditutup.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketInfoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  closeTicketBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  closeTicketText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  messagesList: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 0,
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textMe: {
    color: '#ffffff',
  },
  textOther: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 9,
    color: '#cbd5e1',
    marginTop: 4,
  },
  systemMessageContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginVertical: 12,
    maxWidth: '90%',
  },
  systemMessageText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
  },
  footerInputRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  closedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});
