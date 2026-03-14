import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Search, ArrowLeft, Filter, Users } from 'lucide-react-native';
import apiClient from '../api/client';
import CustomerItem from '../components/CustomerItem';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerListScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'offline' | 'isolir'>('all');
  const [counts, setCounts] = useState({ all: 0, online: 0, offline: 0, isolir: 0 });

  const fetchCustomers = async () => {
    try {
      const [custRes, activeRes] = await Promise.all([
        apiClient.get('/api/customers?lite=true'),
        apiClient.get('/api/pppoe/active').catch(() => ({ data: [] }))
      ]);

      const activeData = Array.isArray(activeRes.data) ? activeRes.data : [];
      const activeMap = new Map(activeData.map((conn: any) => [conn.name, conn['address'] || conn['remote-address']]));
      
      // API returns an object with username as key, convert to array
      const rawData = custRes.data || {};
      const data = Object.values(rawData).map((c: any) => ({
        ...c,
        isOnline: c.username ? activeMap.has(c.username) : false,
        ipAddress: c.username ? activeMap.get(c.username) : null
      }));

      setCustomers(data);
      
      const onlineCount = data.filter(c => c.isOnline).length;
      const isolirCount = data.filter(c => c.isIsolir).length;
      setCounts({
        all: data.length,
        online: onlineCount,
        offline: data.length - onlineCount,
        isolir: isolirCount
      });
      
    } catch (e) {
      console.error('Failed to fetch customers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) || 
        (c.username && c.username.toLowerCase().includes(query)) ||
        (c.customerId && c.customerId.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
      );
    }

    // Type filter
    if (filterType === 'online') {
      filtered = filtered.filter(c => c.isOnline);
    } else if (filterType === 'offline') {
      filtered = filtered.filter(c => !c.isOnline);
    } else if (filterType === 'isolir') {
      filtered = filtered.filter(c => c.isIsolir);
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, customers, filterType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.topSection}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('users.listTitle')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchContainer}>
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

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
                {t('users.all')} ({counts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'online' && styles.filterChipActive]}
              onPress={() => setFilterType('online')}
            >
              <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.filterChipText, filterType === 'online' && styles.filterChipTextActive]}>
                {t('users.online')} ({counts.online})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'offline' && styles.filterChipActive]}
              onPress={() => setFilterType('offline')}
            >
              <View style={[styles.statusDot, { backgroundColor: '#cbd5e1' }]} />
              <Text style={[styles.filterChipText, filterType === 'offline' && styles.filterChipTextActive]}>
                {t('users.offline')} ({counts.offline})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'isolir' && styles.filterChipActive]}
              onPress={() => setFilterType('isolir')}
            >
              <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.filterChipText, filterType === 'isolir' && styles.filterChipTextActive]}>
                {t('users.isolir')} ({counts.isolir})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <CustomerItem 
              customer={item} 
              onPress={() => navigation.navigate('CustomerDetail', { customer: item })} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Users size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t('users.notFound')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={filteredCustomers.length === 0 ? { flex: 1 } : null}
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
  topSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
