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
  Dimensions,
  StatusBar,
  ScrollView
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
import { COLORS } from '../constants/theme';
import GradientHeader from '../components/GradientHeader';

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
          <TrendingUp size={12} color={COLORS.slate[400]} />
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
          color={COLORS.primary} 
          icon={DollarSign}
        />
        <SummaryCard 
          title={t('financial.unpaid')} 
          amount={data?.summary?.totalUnpaid} 
          color={COLORS.warning} 
          icon={AlertCircle}
        />
        <SummaryCard 
          title={t('financial.expenses')} 
          amount={data?.summary?.totalCommissions} 
          color={COLORS.error} 
          icon={ArrowDownRight}
        />
        <SummaryCard 
          title={t('financial.netIncome')} 
          amount={data?.summary?.netIncome} 
          color={COLORS.success} 
          icon={TrendingUp}
        />
      </View>

      {/* Staff Performance */}
      <View style={styles.sectionHeader}>
        <Users size={18} color={COLORS.slate[800]} />
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
        <FileText size={18} color={COLORS.slate[800]} />
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
          <Text style={[styles.paymentAmount, item.status !== 'completed' && { color: COLORS.error }]}>
            {formatCurrency(item.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? COLORS.success : COLORS.error }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentFooter}>
        <View style={styles.footerItem}>
          <Calendar size={12} color={COLORS.slate[400]} />
          <Text style={styles.footerText}>
            {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Users size={12} color={COLORS.slate[400]} />
          <Text style={styles.footerText}>{item.agentName}</Text>
        </View>
        <View style={styles.footerItem}>
          <PieChart size={12} color={COLORS.slate[400]} />
          <Text style={styles.footerText}>{item.method || 'Cash'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GradientHeader 
        title={t('financial.title')}
        onBackPress={() => navigation.goBack()}
      />

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <View style={styles.selectorWrapper}>
            <Calendar size={16} color={COLORS.slate[500]} />
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

      <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <ShareIcon size={18} color={COLORS.slate[500]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={[styles.actionButton, printing && { opacity: 0.5 }]} disabled={printing}>
            {printing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Printer size={18} color={COLORS.slate[500]} />
            )}
          </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.allPayments || []}
          renderItem={renderPaymentItem}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PieChart size={64} color={COLORS.slate[200]} />
              <Text style={styles.emptyText}>{t('financial.noData')}</Text>
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
    backgroundColor: COLORS.white,
  },
  headerRightActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
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
    backgroundColor: COLORS.slate[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[700],
  },
  monthPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.slate[50],
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate[400],
  },
  pillTextActive: {
    color: COLORS.white,
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
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
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
    color: COLORS.slate[400],
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.slate[900],
  },
  subValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  subValueText: {
    fontSize: 11,
    color: COLORS.slate[400],
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
    color: COLORS.slate[900],
    letterSpacing: -0.3,
  },
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    marginBottom: 32,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
    marginBottom: 8,
  },
  tableHeadText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[50],
    alignItems: 'center',
  },
  tableCellName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[800],
  },
  tableCellText: {
    fontSize: 13,
    color: COLORS.slate[600],
    fontWeight: '600',
  },
  tableCellProfit: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.success,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
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
    color: COLORS.slate[900],
    marginBottom: 4,
  },
  customerUser: {
    fontSize: 13,
    color: COLORS.slate[500],
    fontWeight: '500',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
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
    borderTopColor: COLORS.slate[50],
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
    color: COLORS.slate[400],
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.slate[400],
    fontWeight: '600',
  }
});

