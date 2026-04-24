import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { Search, CreditCard, ChevronRight, AlertCircle, Clock, Banknote } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import GradientHeader from '../components/GradientHeader';

export default function UnpaidBillsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUnpaidBills = async () => {
    try {
      const response = await apiClient.get('/api/billing/payments?status=pending');
      setBills(response.data);
    } catch (error) {
      console.error('Failed to fetch unpaid bills', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnpaidBills();
  };

  const filteredBills = bills.filter(bill => 
    bill.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMonthName = (month: number) => {
    const months = [
      t('billing.january') || 'Jan', t('billing.february') || 'Feb', t('billing.march') || 'Mar', 
      t('billing.april') || 'Apr', t('billing.may') || 'Mei', t('billing.june') || 'Jun', 
      t('billing.july') || 'Jul', t('billing.august') || 'Agu', t('billing.september') || 'Sep', 
      t('billing.october') || 'Okt', t('billing.november') || 'Nov', t('billing.december') || 'Des'
    ];
    return months[month] || '';
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.billCard}
      onPress={() => navigation.navigate('PaymentForm', { 
        username: item.username,
        amount: item.amount,
        month: item.month,
        year: item.year
      })}
    >
      <View style={styles.billIcon}>
        <Banknote size={24} color="#2563eb" />
      </View>
      <View style={styles.billInfo}>
        <View style={styles.billHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.amount}>Rp {item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>{t('billing.invoice')}: </Text>
          <Text style={styles.invoice}>{item.invoiceNumber}</Text>
        </View>
        <View style={styles.periodRow}>
          <View style={styles.periodBadge}>
            <Clock size={12} color="#64748b" />
            <Text style={styles.periodText}>{getMonthName(item.month)} {item.year}</Text>
          </View>
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <ChevronRight size={18} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GradientHeader 
        title={t('billing.unpaidBills')} 
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('billing.searchInvoicePlaceholder')}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <CreditCard size={48} color="#2563eb" />
              </View>
              <Text style={styles.emptyTitle}>{t('billing.noBills')}</Text>
              <Text style={styles.emptyDesc}>{t('billing.noBillsDesc')}</Text>
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
    padding: 20,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
    flexGrow: 1,
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  billIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  billInfo: {
    flex: 1,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  amount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ef4444',
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoice: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '800',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  periodText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
