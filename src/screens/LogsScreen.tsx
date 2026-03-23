import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { ClipboardList, Wifi, WifiOff, Clock, Search, Filter } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';
import { TextInput, StatusBar, Platform } from 'react-native';

export default function LogsScreen() {
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const response = await apiClient.get('/api/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (log.username && log.username.toLowerCase().includes(search)) ||
      (log.message && log.message.toLowerCase().includes(search))
    );
  });

  const renderItem = ({ item }: { item: any }) => {
    const isConnected = item.status === 'connected';
    
    return (
      <View style={styles.logItem}>
        <View style={[styles.statusIcon, { backgroundColor: isConnected ? '#ecfdf5' : '#fef2f2' }]}>
          {isConnected ? <Wifi size={18} color="#10b981" /> : <WifiOff size={18} color="#ef4444" />}
        </View>
        <View style={styles.logDetails}>
          <View style={styles.logHeader}>
            <Text style={styles.username}>{item.username || t('common.system')}</Text>
            <View style={styles.timeWrapper}>
              <Clock size={10} color="#94a3b8" />
              <Text style={styles.timeText}>
                {new Date(item.time).toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: language === 'en' })}
              </Text>
            </View>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.dateText}>
            {new Date(item.time).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('logs.title')}
        subtitle={t('logs.subtitle')}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('systemUsers.searchPlaceholder')}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <ClipboardList size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ClipboardList size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>{t('logs.noLogs')}</Text>
              <Text style={styles.emptyText}>{t('logs.noLogsDesc')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    borderRadius: 20,
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  refreshBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logItem: {
    flexDirection: 'row',
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
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logDetails: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '500',
  }
});
