import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar
} from 'react-native';
import { 
  Wifi, 
  ArrowLeft, 
  Search, 
  Power, 
  Clock, 
  Globe, 
  Shield, 
  RefreshCw,
  Server,
  UserX,
  Smartphone
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pppoeService } from '../services/pppoeService';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';
import { COLORS } from '../constants/theme';

export default function ActiveConnectionsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kickingId, setKickingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await pppoeService.getActiveConnections();
      setSessions(data);
      setFilteredSessions(data);
    } catch (e) {
      console.error('Fetch Error:', e);
      Alert.alert(t('common.error'), t('common.fetchError') || 'Gagal mengambil data koneksi aktif');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sessions.filter(s => 
        (s.name && s.name.toLowerCase().includes(query)) || 
        (s.address && s.address.toLowerCase().includes(query)) ||
        (s['caller-id'] && s['caller-id'].toLowerCase().includes(query))
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleKick = (session: any) => {
    Alert.alert(
      t('nas.kickTitle') || 'Putuskan Koneksi',
      (t('nas.kickConfirm') || 'Apakah Anda yakin ingin memutuskan koneksi {name}?').replace('{name}', session.name),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('nas.kickBtn') || 'Putuskan', 
          style: 'destructive',
          onPress: async () => {
            try {
              setKickingId(session['.id']);
              await pppoeService.disconnectSession(session['.id']);
              Alert.alert(t('common.success'), t('nas.kickSuccess') || 'Koneksi berhasil diputuskan');
              fetchData();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.response?.data?.error || t('common.error'));
            } finally {
              setKickingId(null);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Wifi size={24} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceText}>{item.service?.toUpperCase() || 'PPPOE'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => handleKick(item)} 
          style={styles.kickBtn}
          disabled={kickingId === item['.id']}
        >
          {kickingId === item['.id'] ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <UserX size={20} color="#ef4444" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Globe size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>IP Address:</Text>
          <Text style={styles.detailValue}>{item.address || '-'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>Uptime:</Text>
          <Text style={styles.detailValue}>{item.uptime || '-'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Smartphone size={14} color="#94a3b8" />
          <Text style={styles.detailLabel}>MAC/Caller-ID:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{item['caller-id'] || '-'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('sidebar.activeConnections')}
        subtitle={`${sessions.length} koneksi saat ini`}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
            <RefreshCw size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('users.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memantau Jaringan...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderItem}
          keyExtractor={(item, index) => item['.id'] || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Wifi size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>Tidak ada koneksi aktif saat ini</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  serviceBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  serviceText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  kickBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  detailsGrid: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', width: 90 },
  detailValue: { fontSize: 13, fontWeight: '800', color: '#475569', flex: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94a3b8', fontWeight: '700' },
});
