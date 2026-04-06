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
  Alert,
  Modal,
  TouchableWithoutFeedback
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
  Clock,
  Download,
  ChevronDown,
  Calendar
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

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

  const handleDownloadPDF = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #334155; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
              .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
              .card { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .card-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
              .card-value { font-size: 18px; font-weight: bold; color: #0f172a; }
              .section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; border-left: 4px solid #3b82f6; padding-left: 10px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding: 10px 5px; }
              td { padding: 10px 5px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
              .text-right { text-align: right; }
              .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">${t('financial.title') || 'Laporan Keuangan'}</h1>
              <p class="subtitle">${(months[selectedMonth] || '').toUpperCase()} ${selectedYear}</p>
            </div>
            
            <div class="summary-grid">
              <div class="card">
                <div class="card-label">${data?.isAgentView ? (t('financial.myEarnings') || 'PENDAPATAN SAYA') : (t('financial.netIncome') || 'PENDAPATAN BERSIH')}</div>
                <div class="card-value">${formatCurrency(data?.summary?.netIncome)}</div>
              </div>
              <div class="card">
                <div class="card-label">${data?.isAgentView ? (t('financial.totalBilling') || 'TOTAL PENAGIHAN') : (t('financial.revenue') || 'TOTAL REVENUE')}</div>
                <div class="card-value">${formatCurrency(data?.summary?.totalRevenue)}</div>
              </div>
            </div>

            ${!data?.isAgentView && data?.staffBreakdown?.length > 0 ? `
              <h2 class="section-title">${t('financial.staffPerformance') || 'Performa Staff'}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th class="text-right">Trx</th>
                    <th class="text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.staffBreakdown.map((s: any) => `
                    <tr>
                      <td>${s.name || s.username}</td>
                      <td class="text-right">${s.count}</td>
                      <td class="text-right">${formatCurrency((s.revenue || 0) - (s.commission || 0))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            <h2 class="section-title">${t('financial.allPayments') || 'Detail Pembayaran'}</h2>
            <table>
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th class="text-right">Jumlah</th>
                  <th class="text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                ${(data?.allPayments || []).map((p: any) => `
                  <tr>
                    <td>${p.customerName}</td>
                    <td class="text-right">${formatCurrency(p.amount)}</td>
                    <td class="text-right">${new Date(p.date).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated by Buroq App on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Gagal generate PDF');
    } finally {
      setLoading(false);
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
            color={COLORS.error} 
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

      {/* Body Action Buttons - Move here from absolute top */}
      <View style={styles.bodyActionsGrid}>
        <TouchableOpacity style={styles.bodyActionButton} onPress={handleDownloadPDF}>
          <View style={[styles.bodyActionIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Download size={22} color={COLORS.primary} />
          </View>
          <View style={styles.bodyActionTextContainer}>
             <Text style={styles.bodyActionTitle}>{t('financial.downloadPdf') || 'Download PDF'}</Text>
             <Text style={styles.bodyActionSubtitle}>{t('financial.saveSharePdf') || 'Simpan & Bagikan Laporan'}</Text>
          </View>
          <ChevronRight size={18} color={COLORS.slate[300]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bodyActionButton, printing && { opacity: 0.7 }]} 
          onPress={handlePrint} 
          disabled={printing}
        >
          <View style={[styles.bodyActionIcon, { backgroundColor: COLORS.success + '15' }]}>
            {printing ? <ActivityIndicator size="small" color={COLORS.success} /> : <Printer size={22} color={COLORS.success} />}
          </View>
          <View style={styles.bodyActionTextContainer}>
             <Text style={styles.bodyActionTitle}>{t('financial.printThermal') || 'Cetak Thermal'}</Text>
             <Text style={styles.bodyActionSubtitle}>{t('financial.printViaBluetooth') || 'Cetak struk via Bluetooth'}</Text>
          </View>
          <ChevronRight size={18} color={COLORS.slate[300]} />
        </TouchableOpacity>
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
            <Text style={styles.customerUser}>{item.invoiceNumber ? `${item.invoiceNumber} • ` : ''}@{item.username}</Text>
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
    { type: 'section_title', title: t('financial.unpaid_tagihan') || 'TAGIHAN (PENDING)', count: unpaidPayments.length, color: COLORS.error },
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
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.92)' }} />
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />
        )}
      </View>

      <GradientHeader 
        title={t('financial.title') || 'Laporan Keuangan'}
        onBackPress={() => navigation.goBack()}
      />

      {/* Month & Year Selectors (Dropdowns) */}
      <View style={styles.filterBar}>
        <View style={styles.dropdownContainer}>
           <TouchableOpacity 
             style={styles.dropdownButton} 
             onPress={() => setYearModalVisible(true)}
           >
             <View style={styles.dropdownIconBox}>
                <Calendar size={16} color={COLORS.primary} />
             </View>
             <Text style={styles.dropdownText}>{selectedYear}</Text>
             <ChevronDown size={18} color={COLORS.slate[400]} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.dropdownButton} 
             onPress={() => setMonthModalVisible(true)}
           >
             <View style={styles.dropdownIconBox}>
                <CalendarIcon size={16} color={COLORS.primary} />
             </View>
             <Text style={styles.dropdownText}>{months[selectedMonth]}</Text>
             <ChevronDown size={18} color={COLORS.slate[400]} />
           </TouchableOpacity>
        </View>
      </View>

      {/* Selectors Modals */}
      <Modal visible={monthModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMonthModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('financial.selectMonth') || 'Pilih Bulan'}</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {months.map((m, i) => (
                  <TouchableOpacity 
                    key={m} 
                    style={[styles.modalOption, selectedMonth === i && styles.modalOptionActive]} 
                    onPress={() => {
                      setSelectedMonth(i);
                      setMonthModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, selectedMonth === i && styles.modalOptionActiveText]}>{m}</Text>
                    {selectedMonth === i && <CheckCircle2 size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={yearModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setYearModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('financial.selectYear') || 'Pilih Tahun'}</Text>
              <ScrollView>
                {years.map(y => (
                  <TouchableOpacity 
                    key={y} 
                    style={[styles.modalOption, selectedYear === y && styles.modalOptionActive]} 
                    onPress={() => {
                      setSelectedYear(y);
                      setYearModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, selectedYear === y && styles.modalOptionActiveText]}>{y}</Text>
                    {selectedYear === y && <CheckCircle2 size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  filterBar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 10,
  },
  dropdownIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[700],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.slate[900],
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: COLORS.primary + '08',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[600],
  },
  modalOptionActiveText: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  bodyActionsGrid: {
    marginBottom: 24,
    gap: 12,
  },
  bodyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bodyActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bodyActionTextContainer: {
    flex: 1,
  },
  bodyActionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.slate[800],
    marginBottom: 2,
  },
  bodyActionSubtitle: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
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

