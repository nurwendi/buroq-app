import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { Search, CreditCard, ChevronRight, AlertCircle, ArrowLeft, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function UnpaidBillsScreen() {
  const navigation = useNavigation<any>();
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
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
        <Clock size={24} color="#f59e0b" />
      </View>
      <View style={styles.billInfo}>
        <View style={styles.billHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.amount}>Rp {item.amount.toLocaleString()}</Text>
        </View>
        <Text style={styles.invoice}>{item.invoiceNumber}</Text>
        <Text style={styles.period}>Periode: {getMonthName(item.month)} {item.year}</Text>
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tagihan Tertunda</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari username atau invoice..."
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AlertCircle size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Tidak Ada Tagihan</Text>
              <Text style={styles.emptyDesc}>Semua tagihan telah lunas atau belum ada tagihan terdaftar.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  billInfo: {
    flex: 1,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  invoice: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  period: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
