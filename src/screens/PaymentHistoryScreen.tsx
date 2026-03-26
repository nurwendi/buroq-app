import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, CreditCard, ChevronRight, Filter, Calendar, Printer } from 'lucide-react-native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { printReceipt } from '../utils/printer';
import PrinterSettingsModal from '../components/PrinterSettingsModal';
import { Alert } from 'react-native';

export default function PaymentHistoryScreen({ route, navigation }: any) {
  const { username, name } = route.params;
  const { t } = useLanguage();
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = username ? `/api/billing/payments?username=${username}` : '/api/billing/payments';
      const response = await apiClient.get(url);
      setPayments(response.data);
    } catch (e) {
      console.error('Failed to fetch payments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [username]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const handlePrint = async (item: any) => {
    try {
      await printReceipt({
        invoiceNumber: item.invoiceNumber,
        customerName: item.customerName || (name !== t('billing.history') ? name : null),
        username: item.username || username,
        date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        amount: item.amount,
        paymentMethod: item.method === 'cash' ? (t('billing.cash') || 'Tunai') : (t('billing.transfer') || 'Transfer'),
        agentFullName: item?.agentFullName || user?.fullName || user?.name || user?.username,
        agentPhone: item?.agentPhone || user?.phone,
        period: item?.month !== undefined ? `${[
          t('billing.january') || 'Januari', t('billing.february') || 'Februari', t('billing.march') || 'Maret', 
          t('billing.april') || 'April', t('billing.may') || 'Mei', t('billing.june') || 'Juni',
          t('billing.july') || 'Juli', t('billing.august') || 'Agustus', t('billing.september') || 'September', 
          t('billing.october') || 'Oktober', t('billing.november') || 'November', t('billing.december') || 'Desember'
        ][item.month]} ${item.year}` : undefined
      });
      Alert.alert(t('common.success'), t('billing.printingReceipt'));
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes('belum disetting')) {
        setPrinterModalVisible(true);
      } else {
        Alert.alert(t('common.error'), errorMsg || t('billing.printReceiptError'));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'unpaid': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderPaymentItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          {(!username) && (
             <Text style={styles.customerNameInList}>{item.customerName || item.username}</Text>
          )}
          <Text style={styles.paymentDate}>
            {new Date(item.date).toLocaleDateString(t('common.locale') === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentBody}>
        <View style={styles.paymentMethod}>
          <CreditCard size={16} color="#94a3b8" />
          <Text style={styles.methodText}>{item.method === 'cash' ? (t('billing.cash') || 'Cash') : (t('billing.transfer') || 'Transfer')}</Text>
        </View>
        <Text style={styles.amountText}>Rp {item.amount.toLocaleString()}</Text>
      </View>
      
      {item.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText} numberOfLines={1}>{item.notes}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        style={styles.printButton}
        onPress={() => handlePrint(item)}
      >
        <Printer size={16} color="#2563eb" />
        <Text style={styles.printButtonText}>{t('billing.printReceipt')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{t('billing.paymentHistory')}</Text>
          {username ? (
            <Text style={styles.subtitle}>{name || username}</Text>
          ) : (
            <Text style={styles.subtitle}>{t('billing.allTransactions') || 'Semua Transaksi'}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Calendar size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <CreditCard size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t('billing.noPaymentHistory')}</Text>
            </View>
          }
        />
      )}

      <PrinterSettingsModal 
        visible={printerModalVisible} 
        onClose={() => setPrinterModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  customerNameInList: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paymentBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  notesBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  notesText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
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
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  printButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '700',
  }
});
