import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  SafeAreaView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  FileText,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Printer,
  Share as ShareIcon
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Share, Alert } from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { printReport } from '../utils/printer';

const { width } = Dimensions.get('window');

export default function FinancialReportScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const fetchReport = async () => {
    try {
      const response = await apiClient.get(`/api/reports/financial?month=${selectedMonth}&year=${selectedYear}`);
      setData(response.data);
    } catch (e) {
      console.error('Failed to fetch report', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleShare = async () => {
    if (!data) return;
    
    const summary = `*LAPORAN KEUANGAN ${months[selectedMonth].toUpperCase()} ${selectedYear}*\n\n` +
      `- Revenue: ${formatCurrency(data.summary.totalRevenue)}\n` +
      `- Unpaid: ${formatCurrency(data.summary.totalUnpaid)}\n` +
      `- Expenses: ${formatCurrency(data.summary.totalCommissions)}\n` +
      `*NET INCOME: ${formatCurrency(data.summary.netIncome)}*\n\n` +
      `_Sent from Buroq Manager Mobile_`;

    try {
      await Share.share({
        message: summary,
        title: `Laporan Keuangan ${months[selectedMonth]} ${selectedYear}`
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  const handlePrint = async () => {
    if (!data) return;
    setPrinting(true);
    try {
      await printReport(months[selectedMonth], selectedYear, data);
      Alert.alert('Sukses', 'Laporan berhasil dikirim ke printer');
    } catch (error: any) {
      Alert.alert('Gagal Mencetak', error.message || 'Pastikan printer bluetooth sudah terhubung.');
    } finally {
      setPrinting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const SummaryCard = ({ title, amount, color, icon: Icon, subValue }: any) => (
    <View style={styles.summaryCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardAmount, { color: color }]}>{formatCurrency(amount)}</Text>
      {subValue && (
        <View style={styles.subValueRow}>
          <TrendingUp size={12} color="#94a3b8" />
          <Text style={styles.subValueText}>{subValue}</Text>
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Summary Grid */}
      <View style={styles.summaryGrid}>
        <SummaryCard 
          title="Revenue" 
          amount={data?.summary?.totalRevenue} 
          color="#2563eb" 
          icon={DollarSign}
        />
        <SummaryCard 
          title="Unpaid" 
          amount={data?.summary?.totalUnpaid} 
          color="#f59e0b" 
          icon={AlertCircle}
        />
        <SummaryCard 
          title="Expenses" 
          amount={data?.summary?.totalCommissions} 
          color="#ef4444" 
          icon={ArrowDownRight}
        />
        <SummaryCard 
          title="Net Income" 
          amount={data?.summary?.netIncome} 
          color="#10b981" 
          icon={TrendingUp}
        />
      </View>

      {/* Staff Performance */}
      <View style={styles.sectionHeader}>
        <Users size={18} color="#1e293b" />
        <Text style={styles.sectionTitle}>Staff Performance</Text>
      </View>
      
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeadText, { flex: 2 }]}>Staff</Text>
          <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Count</Text>
          <Text style={[styles.tableHeadText, { flex: 2, textAlign: 'right' }]}>Net Profit</Text>
        </View>
        {data?.staffBreakdown?.map((s: any, i: number) => (
          <View key={i} style={[styles.tableRow, i === data.staffBreakdown.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[styles.tableCellName, { flex: 2 }]}>{s.name}</Text>
            <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center' }]}>{s.count}</Text>
            <Text style={[styles.tableCellProfit, { flex: 2, textAlign: 'right' }]}>
              {formatCurrency(s.revenue - s.commission)}
            </Text>
          </View>
        ))}
      </View>

      {/* All Payments */}
      <View style={styles.sectionHeader}>
        <FileText size={18} color="#1e293b" />
        <Text style={styles.sectionTitle}>Semua Pembayaran</Text>
      </View>
    </View>
  );

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentMain}>
        <View style={styles.paymentLeft}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.customerUser}>@{item.username}</Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={[styles.paymentAmount, item.status !== 'completed' && { color: '#ef4444' }]}>
            {formatCurrency(item.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? '#10b981' : '#ef4444' }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentFooter}>
        <View style={styles.footerItem}>
          <Calendar size={12} color="#94a3b8" />
          <Text style={styles.footerText}>
            {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Users size={12} color="#94a3b8" />
          <Text style={styles.footerText}>{item.agentName}</Text>
        </View>
        <View style={styles.footerItem}>
          <PieChart size={12} color="#94a3b8" />
          <Text style={styles.footerText}>{item.method || 'Cash'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Keuangan</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <ShareIcon size={20} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.actionButton} disabled={printing}>
            {printing ? (
              <ActivityIndicator size="small" color="#1e293b" />
            ) : (
              <Printer size={20} color="#1e293b" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <View style={styles.selectorWrapper}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.selectorLabel}>{months[selectedMonth]} {selectedYear}</Text>
          </View>
          
          <View style={styles.monthPills}>
            {months.map((m, i) => (
              <TouchableOpacity 
                key={m} 
                onPress={() => setSelectedMonth(i)}
                style={[styles.pill, selectedMonth === i && styles.pillActive]}
              >
                <Text style={[styles.pillText, selectedMonth === i && styles.pillTextActive]}>{m.substring(0, 3)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={data?.allPayments || []}
          renderItem={renderPaymentItem}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PieChart size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Tidak ada data laporan bulan ini</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: Platform.OS === 'android' ? 40 : 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  filterBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  selectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  monthPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: (width - 44) / 2,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  subValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  subValueText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  tableHeadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'center',
  },
  tableCellName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  tableCellText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  tableCellProfit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  paymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  customerUser: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  paymentFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
