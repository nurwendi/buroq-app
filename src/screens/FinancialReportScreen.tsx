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
  ScrollView,
  ImageBackground,
  Share,
  Alert
} from 'react-native';
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  FileText,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Printer,
  Share2,
  CheckCircle2,
  Clock
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loginBgUrl, setLoginBgUrl] = useState('');
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = t('financial.months') as unknown as string[] || 
    ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

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
    } catch (e) {
      console.log('Failed to fetch settings');
    }
  };

  const fetchReport = async () => {
    try {
      const response = await apiClient.get(`/api/reports/financial?month=${selectedMonth + 1}&year=${selectedYear}`);
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
    fetchSettings();
  }, [selectedMonth, selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleShare = async () => {
    if (!data) return;
    
    const summary = `${t('financial.title') || 'Laporan Keuangan'} - ${(months[selectedMonth] || '').toUpperCase()} ${selectedYear}\n\n` +
      `- ${t('financial.revenue') || 'Revenue'}: ${formatCurrency(data?.summary?.totalRevenue)}\n` +
      `- ${t('financial.unpaid') || 'Unpaid'}: ${formatCurrency(data?.summary?.totalUnpaid)}\n` +
      `- ${t('financial.expenses') || 'Expenses'}: ${formatCurrency(data?.summary?.totalCommissions)}\n` +
      `*${(t('financial.netIncome') || 'Net Income').toUpperCase()}: ${formatCurrency(data?.summary?.netIncome)}*\n\n` +
      `_Sent from Buroq App_`;

    try {
      await Share.share({
        message: summary,
        title: `${t('financial.title') || 'Laporan'} ${months[selectedMonth]} ${selectedYear}`
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
      Alert.alert(t('common.success') || 'Berhasil', t('financial.printSuccess') || 'Laporan berhasil dicetak');
    } catch (error: any) {
      Alert.alert(t('financial.printError') || 'Gagal Cetak', error.message || 'Pastikan printer sudah terhubung');
    } finally {
      setPrinting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0).replace('IDR', 'Rp').replace('Rp ', 'Rp ');
  };

  const SummaryCard = ({ title, amount, color, icon: Icon, isPrimary }: any) => (
    <View style={[styles.summaryCard, isPrimary && styles.summaryCardPrimary]}>
      <View style={[styles.iconBox, { backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : color + '15' }]}>
        <Icon size={18} color={isPrimary ? '#ffffff' : color} />
      </View>
      <Text style={[styles.cardLabel, isPrimary && { color: 'rgba(255,255,255,0.8)' }]}>{title}</Text>
      <Text style={[styles.cardValue, isPrimary && { color: '#ffffff' }, { color: isPrimary ? '#ffffff' : color }]}>{formatCurrency(amount)}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSpacer}>
      <View style={styles.summaryGrid}>
        <View style={{ width: '100%', marginBottom: 12 }}>
          <SummaryCard 
            title={data?.isAgentView ? (t('financial.myEarnings') || 'PENDAPATAN SAYA') : (t('financial.netIncome') || 'PENDAPATAN BERSIH')} 
            amount={data?.summary?.netIncome} 
            color="#ffffff" 
            icon={TrendingUp}
            isPrimary
          />
        </View>
        <View style={{ width: '48%' }}>
          <SummaryCard 
            title={data?.isAgentView ? (t('financial.totalBilling') || 'TOTAL PENAGIHAN') : (t('financial.revenue') || 'TOTAL REVENUE')} 
            amount={data?.summary?.totalRevenue} 
            color={COLORS.primary} 
            icon={DollarSign}
          />
        </View>
        <View style={{ width: '48%' }}>
          <SummaryCard 
            title={t('financial.unpaid_tagihan') || 'PIUTANG'} 
            amount={data?.summary?.totalUnpaid} 
            color={COLORS.warning} 
            icon={Clock}
          />
        </View>
        {!data?.isAgentView && (
          <View style={{ width: '100%', marginTop: 12 }}>
             <SummaryCard 
                title={t('financial.expenses') || 'KOMISI AGEN'} 
                amount={data?.summary?.totalCommissions} 
                color={COLORS.error} 
                icon={ArrowDownRight}
             />
          </View>
        )}
      </View>

      {!data?.isAgentView && data?.staffBreakdown?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={COLORS.slate[800]} />
            <Text style={styles.sectionTitle}>{t('financial.staffPerformance') || 'Performa Staff'}</Text>
          </View>
          <View style={styles.glassCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, { flex: 2 }]}>{t('financial.staff') || 'Staff'}</Text>
              <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>{t('financial.count') || 'Trx'}</Text>
              <Text style={[styles.tableHeadText, { flex: 2, textAlign: 'right' }]}>{t('financial.profit') || 'Profit'}</Text>
            </View>
            {(data?.staffBreakdown || []).map((s: any, i: number) => (
              <View key={i} style={[styles.tableRow, i === (data?.staffBreakdown?.length || 0) - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableCellName, { flex: 2 }]} numberOfLines={1}>{s.name || s.username}</Text>
                <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center' }]}>{s.count || 0}</Text>
                <Text style={[styles.tableCellProfit, { flex: 2, textAlign: 'right' }]}>
                  {formatCurrency((s.revenue || 0) - (s.commission || 0))}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <FileText size={18} color={COLORS.slate[800]} />
        <Text style={styles.sectionTitle}>{t('financial.allPayments') || 'Detail Pembayaran'}</Text>
      </View>
    </View>
  );

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentMain}>
        <View style={styles.paymentLeft}>
          <View style={[styles.statusIcon, { backgroundColor: item.status === 'completed' ? '#dcfce7' : '#fee2e2' }]}>
            {item.status === 'completed' ? <CheckCircle2 size={16} color={COLORS.success} /> : <Clock size={16} color={COLORS.error} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
            <Text style={styles.customerUser}>#{item.customerNumber} • @{item.username}</Text>
          </View>
        </View>
        <View style={styles.paymentRight}>
          <Text style={[styles.paymentAmount, item.status !== 'completed' && { color: COLORS.error }]}>
            {formatCurrency(item.amount)}
          </Text>
          <Text style={styles.paymentDate}>
            {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      </View>
      <View style={styles.paymentFooter}>
        <View style={styles.footerItem}>
          <Users size={12} color={COLORS.slate[400]} />
          <Text style={styles.footerText}>{item.agentName || '-'}</Text>
        </View>
        <View style={styles.footerItem}>
          <PieChart size={12} color={COLORS.slate[400]} />
          <Text style={styles.footerText}>{item.method || 'Cash'}</Text>
        </View>
      </View>
    </View>
  );

  // Group payments
  const paidPayments = data?.allPayments?.filter((p: any) => p.status === 'completed') || [];
  const unpaidPayments = data?.allPayments?.filter((p: any) => p.status !== 'completed') || [];

  const groupedData = [
    { type: 'header' },
    { type: 'section_title', title: t('financial.paid') || 'LUNAS (MASUK)', count: paidPayments.length, color: COLORS.success },
    ...paidPayments.map((p: any) => ({ ...p, type: 'payment' })),
    { type: 'section_title', title: t('financial.unpaid_tagihan') || 'TAGIHAN (PENDING)', count: unpaidPayments.length, color: COLORS.warning },
    ...unpaidPayments.map((p: any) => ({ ...p, type: 'payment' }))
  ];

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
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 250, 252, 0.75)' }} />
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />
        )}
      </View>

      <GradientHeader 
        title={t('financial.title') || 'Laporan Keuangan'}
        onBackPress={() => navigation.goBack()}
      />

      {/* Floating Actions */}
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, printing && { opacity: 0.5 }]} onPress={handlePrint} disabled={printing}>
          {printing ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Printer size={20} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {years.map(y => (
            <TouchableOpacity 
              key={y} 
              onPress={() => setSelectedYear(y)}
              style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
            >
              <Text style={[styles.yearText, selectedYear === y && styles.yearTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {Array.isArray(months) && months.map((m, i) => (
            <TouchableOpacity 
              key={m} 
              onPress={() => setSelectedMonth(i)}
              style={[styles.monthChip, selectedMonth === i && styles.monthChipActive]}
            >
              <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }: any) => {
            if (item.type === 'header') return renderHeader();
            if (item.type === 'section_title') return (
              <View style={styles.listSectionHeader}>
                <View style={[styles.sectionCountBadge, { backgroundColor: item.color + '15' }]}>
                  <Text style={[styles.sectionCountText, { color: item.color }]}>{item.count}</Text>
                </View>
                <Text style={[styles.listSectionTitle, { color: item.color }]}>{item.title}</Text>
              </View>
            );
            return renderPaymentItem({ item });
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PieChart size={64} color={COLORS.slate[200]} />
              <Text style={styles.emptyText}>{t('financial.noData') || 'Tidak ada data untuk periode ini'}</Text>
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '600',
  },
  topActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 100,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBar: {
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  yearChipActive: {
    backgroundColor: COLORS.slate[800],
  },
  yearText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate[600],
  },
  yearTextActive: {
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.slate[200],
    marginHorizontal: 8,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  monthChipActive: {
    backgroundColor: COLORS.primary,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate[600],
  },
  monthTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerSpacer: {
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    color: COLORS.slate[500],
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -0.3,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
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
    borderBottomColor: 'rgba(0,0,0,0.03)',
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
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 28,
    alignItems: 'center',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '900',
  },
  paymentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  paymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate[900],
    letterSpacing: -0.3,
  },
  customerUser: {
    fontSize: 12,
    color: COLORS.slate[500],
    fontWeight: '600',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  paymentDate: {
    fontSize: 11,
    color: COLORS.slate[400],
    fontWeight: '700',
    marginTop: 4,
  },
  paymentFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: 12,
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
    marginVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.slate[400],
    fontWeight: '600',
    textAlign: 'center',
  }
});

