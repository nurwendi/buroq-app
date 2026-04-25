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
  StatusBar,
  ImageBackground
} from 'react-native';
import { Search, Users, Plus } from 'lucide-react-native';
import apiClient from '../api/client';
import { customerService } from '../services/customerService';
import { pppoeService } from '../services/pppoeService';
import { Customer } from '../api/models';
import CustomerItem from '../components/CustomerItem';
import { useLanguage } from '../context/LanguageContext';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';

export default function CustomerListScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'offline' | 'isolir'>(route.params?.filter || 'all');
  const [counts, setCounts] = useState({ all: 0, online: 0, offline: 0, isolir: 0 });
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');

  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/app-settings');
      if (res.data.loginBgUrl) setLoginBgUrl(res.data.loginBgUrl);
      if (res.data.dashboardBgUrl) setDashboardBgUrl(res.data.dashboardBgUrl);
    } catch (e) {
      console.log('Failed to fetch settings');
    }
  };

  const fetchCustomers = async () => {
    try {
      const [customersData, activeData] = await Promise.all([
        customerService.getCustomers(true),
        pppoeService.getActiveConnections()
      ]);

      const activeMap = new Map(activeData.map(conn => [conn.name?.toLowerCase(), conn]));
      
      const data: Customer[] = customersData.filter(c => c && typeof c === 'object').map(c => {
        const active = c.username ? activeMap.get(c.username.toLowerCase()) : null;
        return {
          ...c,
          isOnline: !!active,
          ipAddress: active?.address || active?.['remote-address'] || null,
          uptime: active?.uptime || null,
          profileName: c.profile?.name || '-'
        };
      });

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
    fetchSettings();
  }, []);

  useEffect(() => {
    if (route.params?.filter) {
      setFilterType(route.params.filter);
    }
  }, [route.params?.filter]);

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
    await Promise.all([fetchCustomers(), fetchSettings()]);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Absolute Transparent Background */}
      <View style={StyleSheet.absoluteFill}>
        {loginBgUrl ? (
          <ImageBackground
            source={{ uri: resolveUrl(loginBgUrl) }}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 250, 252, 0.92)' }} />
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />
        )}
      </View>

      <GradientHeader 
        title={t('users.listTitle')} 
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.topSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.slate[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('users.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.slate[400]}
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
              <View style={[styles.statusDot, { backgroundColor: filterType === 'online' ? COLORS.white : COLORS.success }]} />
              <Text style={[styles.filterChipText, filterType === 'online' && styles.filterChipTextActive]}>
                {t('users.online')} ({counts.online})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'offline' && styles.filterChipActive]}
              onPress={() => setFilterType('offline')}
            >
              <View style={[styles.statusDot, { backgroundColor: filterType === 'offline' ? COLORS.white : COLORS.slate[300] }]} />
              <Text style={[styles.filterChipText, filterType === 'offline' && styles.filterChipTextActive]}>
                {t('users.offline')} ({counts.offline})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filterType === 'isolir' && styles.filterChipActive]}
              onPress={() => setFilterType('isolir')}
            >
              <View style={[styles.statusDot, { backgroundColor: filterType === 'isolir' ? COLORS.white : COLORS.error }]} />
              <Text style={[styles.filterChipText, filterType === 'isolir' && styles.filterChipTextActive]}>
                {t('users.isolir')} ({counts.isolir})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item, index) => item?.username || `fallback-customer-${index}`}
          renderItem={({ item }) => (
            <CustomerItem 
              customer={item} 
              onPress={() => navigation.navigate('CustomerDetail', { customer: item })} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Users size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>{t('users.notFound')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredCustomers.length === 0 && { flex: 1 }
          ]}
        />
      )}

      {/* FAB for Adding New Customer */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}
        activeOpacity={0.8}
      >
        <Plus color={COLORS.white} size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[900],
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: COLORS.white,
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
    paddingHorizontal: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.slate[900],
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999
  }
});

