import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { 
  ArrowLeft, 
  Bell, 
  Clock, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Search,
  Filter,
  CheckCheck
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/api/notifications?limit=100');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markRead = async (recipientId: string) => {
    try {
      await apiClient.post('/api/notifications/read', { recipientId });
      setNotifications(prev => prev.map(n => n.id === recipientId ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/api/notifications/read', { all: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} color="#10b981" />;
      case 'error': return <XCircle size={20} color="#ef4444" />;
      case 'alert': return <AlertTriangle size={20} color="#f59e0b" />;
      default: return <Info size={20} color="#3b82f6" />;
    }
  };

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'success': return { bg: '#ecfdf5', text: '#059669' };
      case 'error': return { bg: '#fef2f2', text: '#dc2626' };
      case 'alert': return { bg: '#fffbeb', text: '#d97706' };
      default: return { bg: '#eff6ff', text: '#2563eb' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'read') return n.isRead;
    return true;
  }).filter(n => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      n.notification?.title?.toLowerCase().includes(search) || 
      n.notification?.message?.toLowerCase().includes(search)
    );
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifikasi</Text>
        <View style={{ width: 44 }}>
           {unreadCount > 0 && (
             <TouchableOpacity onPress={markAllRead} style={styles.markAllIcon}>
               <CheckCheck size={20} color="#2563eb" />
             </TouchableOpacity>
           )}
        </View>
      </View>

      <View style={styles.filtersWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari notifikasi..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.tabContainer}>
          {['all', 'unread', 'read'].map((f) => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setActiveFilter(f)}
              style={[styles.tab, activeFilter === f && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeFilter === f && styles.activeTabText]}>
                {f === 'all' ? 'Semua' : f === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Bell size={64} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
          <Text style={styles.emptySubtitle}>
            {searchTerm ? 'Pencarian tidak ditemukan.' : 'Belum ada kabar terbaru untuk Anda.'}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredNotifications.map((n) => {
            const badge = getBadgeStyles(n.notification?.type);
            return (
              <TouchableOpacity 
                key={n.id} 
                style={[styles.card, !n.isRead && styles.unreadCard]}
                onPress={() => !n.isRead && markRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    {getTypeIcon(n.notification?.type)}
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeaderMain}>
                      <Text style={[styles.cardTitle, !n.isRead && styles.unreadText]} numberOfLines={1}>
                        {n.notification?.title || 'Sistem'}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: badge.text }]}>
                          {n.notification?.type || 'info'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={12} color="#94a3b8" />
                      <Text style={styles.timeText}>{new Date(n.notification?.createdAt).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.message} numberOfLines={3}>
                  {n.notification?.message}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.senderBox}>
                    {n.notification?.sender?.avatar ? (
                      <View style={styles.avatarMini} /> // No Image for now to avoid issues, placeholder
                    ) : (
                      <View style={styles.initialsMini}>
                        <Text style={styles.initialsMiniText}>
                          {(n.notification?.sender?.fullName || 'S')[0]}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.senderName}>
                      {n.notification?.sender?.fullName || 'Sistem'}
                    </Text>
                  </View>
                  
                  {!n.isRead && (
                    <TouchableOpacity onPress={() => markRead(n.id)} style={styles.markReadBtn}>
                      <Text style={styles.markReadText}>Tandai Dibaca</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  markAllIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#2563eb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    backgroundColor: '#f8fafc',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    color: '#0f172a',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  senderBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  initialsMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  initialsMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  markReadBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  markReadText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  }
});
