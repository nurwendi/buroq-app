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
  StatusBar,
  Image
} from 'react-native';
import { Search, Users, User, ChevronRight, Shield } from 'lucide-react-native';
import apiClient from '../api/client';
import { customerService } from '../services/customerService';
import { Customer } from '../api/models';
import { useLanguage } from '../context/LanguageContext';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';
import { resolveUrl } from '../utils/url';
import { pppoeService } from '../services/pppoeService';
import CustomerItem from '../components/CustomerItem';

export default function SuperadminCustomerListScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      const [customersData, activeData] = await Promise.all([
        customerService.getCustomers(true),
        pppoeService.getActiveConnections()
      ]);
      
      const activeMap = new Map(activeData.map(conn => [conn.name, conn]));
      
      const data: Customer[] = (customersData || []).filter(c => c && typeof c === 'object').map(c => {
        const active = c.username ? activeMap.get(c.username) : null;
        return {
          ...c,
          isOnline: !!active,
          ipAddress: active?.address || active?.['remote-address'] || null,
          uptime: active?.uptime || null,
          profileName: c.profile?.name || '-'
        };
      });

      setCustomers(data);
      setFilteredCustomers(data);
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
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) || 
        (c.username && c.username.toLowerCase().includes(query)) ||
        (c.customerId && c.customerId.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)) ||
        (c.owner?.fullName && c.owner.fullName.toLowerCase().includes(query)) ||
        (c.owner?.username && c.owner.username.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  // Removed renderCustomerItem as we use CustomerItem component now

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      <GradientHeader 
        title={t('dashboard.allCustomers') || 'Semua Pelanggan'} 
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchSection}>
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

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item, index) => item?.username || `super-customer-${index}`}
          renderItem={({ item }) => (
            <CustomerItem 
              customer={item} 
              onPress={() => navigation.navigate('CustomerDetail', { customer: item })} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Users size={64} color={COLORS.slate[200]} />
              <Text style={styles.emptyText}>{t('users.notFound')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
    color: COLORS.slate[900],
  },
  listPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  idLabel: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '700',
  },
  idText: {
    fontSize: 12,
    color: COLORS.slate[600],
    fontWeight: '800',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ownerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  cardRight: {
    marginLeft: 10,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.slate[400],
    fontWeight: '700',
  },
});
