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
import apiClient from '../api/client';

export default function LogsScreen() {
  const navigation = useNavigation();
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
            <Text style={styles.username}>{item.username || 'System'}</Text>
            <View style={styles.timeWrapper}>
              <Clock size={10} color="#94a3b8" />
              <Text style={styles.timeText}>
                {new Date(item.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.dateText}>
            {new Date(item.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Log Sistem</Text>
          <Text style={styles.headerSub}>Aktifitas koneksi real-time</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <ClipboardList size={20} color="#2563eb" />
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
              <Text style={styles.emptyTitle}>Tidak ada log</Text>
              <Text style={styles.emptyText}>Data log akan muncul saat ada aktifitas di sistem.</Text>
            </View>
          }
        />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 8,
  }
});
