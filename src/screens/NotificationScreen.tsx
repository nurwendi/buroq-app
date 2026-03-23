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
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { user } = useAuth();
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('notifications.title')}
        subtitle={unreadCount > 0 ? `${unreadCount} ${t('notifications.unreadSuffix') || 'unread'}` : t('notifications.allCaughtUp')}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={styles.iconButton}>
              <CheckCheck size={22} color="#2563eb" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.filtersWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('notifications.searchPlaceholder')}
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
                {f === 'all' ? t('notifications.all') : f === 'unread' ? t('notifications.unread') : t('notifications.read')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Bell size={64} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
          <Text style={styles.emptySubtitle}>
            {searchTerm ? t('notifications.noSearchFound') : t('notifications.noNewNews')}
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
                        {n.notification?.title || t('notifications.system')}
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
                      {n.notification?.sender?.fullName || t('notifications.system')}
                    </Text>
                  </View>
                  
                  {!n.isRead && (
                    <TouchableOpacity onPress={() => markRead(n.id)} style={styles.markReadBtn}>
                      <Text style={styles.markReadText}>{t('notifications.markAsRead')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  filtersWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.2,
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
    marginTop: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  unreadCard: {
    borderColor: '#dbeafe',
    backgroundColor: '#f8faff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    marginRight: 10,
    letterSpacing: -0.2,
  },
  unreadText: {
    color: '#0f172a',
    fontWeight: '800',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  senderBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  initialsMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initialsMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  senderName: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#2563eb',
    borderRadius: 12,
  },
  markReadText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
  }
});
