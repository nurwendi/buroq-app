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
import { useLanguage } from '../context/LanguageContext';
import { printReport } from '../utils/printer';

const { width } = Dimensions.get('window');

export default function FinancialReportScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = t('financial.months') as unknown as string[];

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
    
    const summary = t('financial.shareTitle', { month: months[selectedMonth].toUpperCase(), year: selectedYear.toString() }) + '\n\n' +
      `- ${t('financial.revenue')}: ${formatCurrency(data.summary.totalRevenue)}\n` +
      `- ${t('financial.unpaid')}: ${formatCurrency(data.summary.totalUnpaid)}\n` +
      `- ${t('financial.expenses')}: ${formatCurrency(data.summary.totalCommissions)}\n` +
      `*${t('financial.netIncome').toUpperCase()}: ${formatCurrency(data.summary.netIncome)}*\n\n` +
      `_${t('financial.sentFrom')}_`;

    try {
      await Share.share({
        message: summary,
        title: t('financial.shareTitle', { month: months[selectedMonth], year: selectedYear.toString() })
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
      Alert.alert(t('common.success'), t('financial.printSuccess'));
    } catch (error: any) {
      Alert.alert(t('financial.printError'), error.message || t('financial.printErrorDesc'));
    } finally {
      setPrinting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
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
          title={t('financial.revenue')} 
          amount={data?.summary?.totalRevenue} 
          color="#2563eb" 
          icon={DollarSign}
        />
        <SummaryCard 
          title={t('financial.unpaid')} 
          amount={data?.summary?.totalUnpaid} 
          color="#f59e0b" 
          icon={AlertCircle}
        />
        <SummaryCard 
          title={t('financial.expenses')} 
          amount={data?.summary?.totalCommissions} 
          color="#ef4444" 
          icon={ArrowDownRight}
        />
        <SummaryCard 
          title={t('financial.netIncome')} 
          amount={data?.summary?.netIncome} 
          color="#10b981" 
          icon={TrendingUp}
        />
      </View>

      {/* Staff Performance */}
      <View style={styles.sectionHeader}>
        <Users size={18} color="#1e293b" />
        <Text style={styles.sectionTitle}>{t('financial.staffPerformance')}</Text>
      </View>
      
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeadText, { flex: 2 }]}>{t('financial.staff')}</Text>
          <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>{t('financial.count')}</Text>
          <Text style={[styles.tableHeadText, { flex: 2, textAlign: 'right' }]}>{t('financial.netProfit')}</Text>
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
        <Text style={styles.sectionTitle}>{t('financial.allPayments')}</Text>
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
            {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short' })}
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
        <Text style={styles.headerTitle}>{t('financial.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <ShareIcon size={18} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={[styles.actionButton, printing && { opacity: 0.5 }]} disabled={printing}>
            {printing ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Printer size={18} color="#475569" />
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
              <Text style={styles.emptyText}>{t('financial.noData')}</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
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
    fontWeight: '800',
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
    fontWeight: '700',
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
    padding: 20,
    paddingBottom: 40,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    width: (width - 52) / 2,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  subValueText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 32,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  tableHeadText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'center',
  },
  tableCellName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  tableCellText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  tableCellProfit: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10b981',
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  paymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  customerUser: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563eb',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paymentFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  }
});
