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
  ScrollView,
  StatusBar
} from 'react-native';
import { Search, Users } from 'lucide-react-native';
import apiClient from '../api/client';
import CustomerItem from '../components/CustomerItem';
import { useLanguage } from '../context/LanguageContext';
import GradientHeader from '../components/GradientHeader';

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

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) || 
        (c.username && c.username.toLowerCase().includes(query)) ||
        (c.customerId && c.customerId.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
      );
    }

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GradientHeader 
        title={t('users.listTitle')} 
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.topSection}>
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
              <View style={[styles.statusDot, { backgroundColor: filterType === 'online' ? '#ffffff' : '#10b981' }]} />
              <Text style={[styles.filterChipText, filterType === 'online' && styles.filterChipTextActive]}>
                {t('users.online')} ({counts.online})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'offline' && styles.filterChipActive]}
              onPress={() => setFilterType('offline')}
            >
              <View style={[styles.statusDot, { backgroundColor: filterType === 'offline' ? '#ffffff' : '#cbd5e1' }]} />
              <Text style={[styles.filterChipText, filterType === 'offline' && styles.filterChipTextActive]}>
                {t('users.offline')} ({counts.offline})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'isolir' && styles.filterChipActive]}
              onPress={() => setFilterType('isolir')}
            >
              <View style={[styles.statusDot, { backgroundColor: filterType === 'isolir' ? '#ffffff' : '#ef4444' }]} />
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
              onPress={() => navigation.navigate('CustomerDetail', { username: item.username })} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Users size={48} color="#2563eb" />
              </View>
              <Text style={styles.emptyText}>{t('users.notFound')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredCustomers.length === 0 && { flex: 1 }
          ]}
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
  topSection: {
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '900',
    letterSpacing: -0.5,
  }
});
