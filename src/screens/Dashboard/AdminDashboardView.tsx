import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  RefreshControl,
  ImageBackground,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Users, 
  UserPlus,
  ClipboardCheck,
  Megaphone,
  CreditCard,
  Clock,
  ChevronRight,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Shield,
  FileText,
  Activity,
  WifiOff,
  DollarSign,
  AlertCircle,
  Wallet,
  Wifi,
  ArrowUpRight,
  Banknote,
  Trash2,
  Edit3
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DonutChart from '../../components/DonutChart';
import FinancialWidget from '../../components/FinancialWidget';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { useAlert } from '../../context/AlertContext';
import { COLORS } from '../../constants/theme';

export default function AdminDashboardView() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    routersCount: 0,
    monthlyRevenue: 0,
    pppoeActive: 0,
    pppoeOffline: 0,
    routers: [] as any[],
    unpaidBillsCount: 0,
    adminCount: 0,
    pendingPayments: [] as any[],
    pendingCount: 0,
    pendingRegistrationsCount: 0,
    pendingPaymentsCount: 0,
    grossRevenue: 0,
    netRevenue: 0,
    staffCommission: 0,
    totalUnpaid: 0,
    recentTransactions: [] as any[]
  });
  const [onlineCount, setOnlineCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  
  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      // Since '/api/admin/stats' frequently errors 500 on older backends due to constraint/casing bugs,
      // we bypass it and use '/api/dashboard/stats' which safely returns totalCustomers & routers.
      // We also fetch '/api/billing/stats' safely for financials.
      const [dashRes, billingRes] = await Promise.all([
        apiClient.get('/api/dashboard/stats').catch(() => ({ data: {} })),
        apiClient.get('/api/billing/stats').catch(() => ({ data: {} }))
      ]);
      
      const dashData    = dashRes.data    || {};
      const billingData = billingRes.data || {};

      setStats({
        ...dashData,
        // Override with billingData for financials & pending summary
        grossRevenue:              billingData.grossRevenue || 0,
        netRevenue:                billingData.netRevenue || 0,
        staffCommission:           billingData.staffCommission || 0,
        totalUnpaid:               billingData.totalUnpaid || 0,
        recentTransactions:        billingData.recentTransactions || [],
        
        // Count pending from billing stats instead of admin stats
        pendingRegistrationsCount: billingData.pendingRegistrationsCount || 0,
        pendingPaymentsCount:      billingData.pendingCount || 0,
        pendingCount:              billingData.pendingCount || 0,

        // Ensure these critical fields exist for DonutChart
        totalCustomers:            dashData.totalCustomers || billingData.totalCustomers || 0,
        pppoeActive:               dashData.pppoeActive || billingData.pppoeActive || 0,
        pppoeOffline:              dashData.pppoeOffline || billingData.pppoeOffline || 0,
      });
      setOnlineCount(dashData.pppoeActive || billingData.pppoeActive || 0);
      
    } catch (e: any) {
      console.error('Failed to fetch admin stats', e);
      showAlert({
        title: t('common.error') || 'Error',
        message: e.response?.data?.error || t('common.fetchError') || 'Failed to fetch dashboard statistics.',
        type: 'error'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/app-settings');
      if (res.data.dashboardBgUrl) {
        setDashboardBgUrl(res.data.dashboardBgUrl);
      }
      if (res.data.loginBgUrl) {
        setLoginBgUrl(res.data.loginBgUrl);
      }
    } catch (e) {
      console.log('Failed to fetch settings');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await fetchSettings();
    setRefreshing(false);
  };

  const getPendingInfo = (item: any) => {
    if (item.type === 'payment') return t('dashboard.paymentPending');
    if (item.type === 'registration') {
      if (item.subType === 'edit') return t('dashboard.editPending');
      return t('dashboard.registrationPending');
    }
    return t('dashboard.waitingPayment');
  };

  const getPendingIcon = (item: any) => {
    if (item.type === 'registration') return UserPlus;
    return Clock;
  };

  const headerHeight = insets.top + 120;
  const avatarSize = 70;

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
            {/* Lighter overlay to act as a transparent elegant background */}
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.92)' }} />
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: COLORS.slate[50] }} />
        )}
      </View>

      <ScrollView 
        style={styles.fullScrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Custom Header Section */}
        <View style={[styles.customHeaderContainer, { height: headerHeight }]}>
          {dashboardBgUrl ? (
             <ImageBackground source={{ uri: resolveUrl(dashboardBgUrl) }} style={styles.headerBg} resizeMode="cover">
                <View style={styles.headerOverlay} />
             </ImageBackground>
          ) : (
             <View style={[styles.headerBg, { backgroundColor: COLORS.primary }]} />
          )}
          
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
             <TouchableOpacity style={[styles.iconButton, { opacity: 0 }]} disabled>
                <Bell size={20} color="transparent" />
             </TouchableOpacity>
             <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.welcomeText}>{t('dashboard.welcome')}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>{user?.fullName || user?.username}</Text>
             </View>
             <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notification')}>
                <Bell size={20} color={COLORS.white} />
             </TouchableOpacity>
          </View>
          
          {/* Overlapping Avatar */}
          <View style={[styles.avatarContainer, { bottom: -(avatarSize / 2), alignSelf: 'center' }]}>
             <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} style={{ ...styles.avatarTouch, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}>
               {user?.avatar ? (
                  <Image source={{ uri: resolveUrl(user.avatar) }} style={styles.avatarImage} />
               ) : (
                  <View style={styles.avatarPlaceholder}>
                     <Text style={[styles.avatarInitial, { fontSize: avatarSize * 0.4 }]}>
                        {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                     </Text>
                  </View>
               )}
             </TouchableOpacity>
          </View>
        </View>

        {/* Padding Top to accommodate half the avatar height plus spacing */}
        <View style={styles.bodyContent}>

            {/* Section: Customer Status — Donut Chart */}
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => navigation.navigate('CustomerList', { filter: 'all' })}
              style={styles.section}
            >
              <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.chartCard, { borderWidth: 1, borderColor: '#334155' }]}
              >
                <View style={{ position: 'absolute', top: 16, left: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#ffffff', fontWeight: 'bold' }]}>{t('dashboard.customerStatus')}</Text>
                </View>
                <View style={styles.chartBgIcon}>
                  <Users size={110} color="rgba(255,255,255,0.03)" strokeWidth={1.5} />
                </View>
                <DonutChart
                   size={150}
                   strokeWidth={24}
                   centerValue={stats?.totalCustomers || 0}
                   centerLabel={t('users.all') || 'Semua'}
                   darkBackground
                   segments={[
                     { value: stats?.pppoeActive  || 0, color: '#34d399', label: t('dashboard.pppoeActive')  || 'Online' },
                     { value: stats?.pppoeOffline || 0, color: '#f87171', label: t('dashboard.pppoeOffline') || 'Offline' },
                   ]}
                 />
              </LinearGradient>
            </TouchableOpacity>

           {/* Section: Financial Widget & Pending Stats */}
           <View style={styles.section}>
             <View style={{ gap: 12 }}>
                <FinancialWidget
                  grossRevenue={stats?.grossRevenue || 0}
                  commission={stats?.staffCommission || 0}
                  netRevenue={stats?.netRevenue || 0}
                  totalUnpaid={stats?.totalUnpaid || 0}
                  commissionLabel={t('financial.agentCommission') || 'Komisi Agen'}
                  title={t('financial.thisMonth') || 'Keuangan Bulan Ini'}
                  grossLabel={t('financial.grossRevenue') || 'Total Pendapatan'}
                  netLabel={t('financial.netRevenue') || 'Net Income'}
                  unpaidLabel={t('financial.unpaid') || 'Belum Bayar'}
                />

                {/* Pending stat cards — same as web PendingRegistrationStats */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(stats?.pendingRegistrationsCount || 0) > 0 && (
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('PendingRegistrations')}>
                      <StatCard
                         title={t('dashboard.pendingApproval') || 'Persetujuan User'}
                         value={stats?.pendingRegistrationsCount || 0}
                         icon={UserPlus}
                         color="orange"
                         subtitle={t('dashboard.awaitingValidation') || 'Menunggu Validasi'}
                      />
                    </TouchableOpacity>
                  )}
                  {(stats?.pendingPaymentsCount || 0) > 0 && (
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('UnpaidBills')}>
                      <StatCard
                         title={t('dashboard.pendingPayments') || 'Tagihan Pending'}
                         value={stats?.pendingPaymentsCount || 0}
                         icon={CreditCard}
                         color="blue"
                         subtitle={t('dashboard.invoicesWaiting') || 'Menunggu Pembayaran'}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

           {/* Section: Router Status — sama dengan web RouterStatusCard */}
           {(stats?.routers || []).length > 0 && (
             <View style={styles.section}>
               <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>{t('routers.title') || 'Status Router'}</Text>
               </View>
               <View style={{ gap: 10 }}>
                 {(stats.routers || []).map((router: any) => {
                   const isOnline = router.status === 'online';
                   const cpuLoad  = router.cpuLoad || 0;
                   const memPct   = router.memoryTotal > 0
                     ? Math.round((router.memoryUsed / router.memoryTotal) * 100)
                     : 0;
                   const formatMB = (b: number) => b > 0 ? (b / (1024 * 1024)).toFixed(0) + ' MB' : '0 MB';
                   return (
                     <View key={router.id} style={[
                       styles.routerCard,
                       { borderLeftColor: isOnline ? '#2563eb' : '#ef4444', borderLeftWidth: 4 }
                     ]}>
                       {/* Header */}
                       <View style={styles.routerCardHeader}>
                         <View style={styles.routerCardLeft}>
                           <View style={[styles.routerIconBox, { backgroundColor: isOnline ? '#eff6ff' : '#fff1f2' }]}>
                             <Activity size={18} color={isOnline ? '#2563eb' : '#ef4444'} />
                           </View>
                           <View>
                             <Text style={styles.routerName}>{router.name || 'Router'}</Text>
                             {isOnline && router.identity && (
                               <Text style={styles.routerIdentity}>🆔 {router.identity}</Text>
                             )}
                             <Text style={styles.routerHost}>{router.host}</Text>
                           </View>
                         </View>
                         <View style={[styles.routerBadge, { backgroundColor: isOnline ? '#dcfce7' : '#fee2e2' }]}>
                           <Wifi size={10} color={isOnline ? '#16a34a' : '#dc2626'} />
                           <Text style={[styles.routerBadgeText, { color: isOnline ? '#16a34a' : '#dc2626' }]}>
                             {isOnline ? 'Online' : 'Offline'}
                           </Text>
                         </View>
                       </View>
                       {/* CPU & RAM bars — same as web */}
                       {isOnline && (
                         <View style={{ gap: 10 }}>
                           <View>
                             <View style={styles.barLabelRow}>
                               <Text style={styles.barLabel}>CPU Load</Text>
                               <Text style={[styles.barValue, { color: cpuLoad > 80 ? '#ef4444' : '#2563eb' }]}>{cpuLoad}%</Text>
                             </View>
                             <View style={styles.barTrack}>
                               <View style={[styles.barFill, { width: `${cpuLoad}%`, backgroundColor: cpuLoad > 80 ? '#ef4444' : '#3b82f6' }]} />
                             </View>
                           </View>
                           <View>
                             <View style={styles.barLabelRow}>
                               <Text style={styles.barLabel}>RAM ({formatMB(router.memoryUsed)})</Text>
                               <Text style={[styles.barValue, { color: '#6366f1' }]}>{memPct}%</Text>
                             </View>
                             <View style={styles.barTrack}>
                               <View style={[styles.barFill, { width: `${memPct}%`, backgroundColor: '#6366f1' }]} />
                             </View>
                           </View>
                         </View>
                       )}
                     </View>
                   );
                 })}
               </View>
             </View>
           )}


           {/* Section: Main Menu — Icon Grid */}
           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('dashboard.mainMenu')}</Text>
             </View>
             <View style={styles.menuGrid}>
                {/* Tambah Pelanggan */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#10b981' }]}>
                    <UserPlus size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('common.add')}</Text>
                </TouchableOpacity>

                {/* Pelanggan */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CustomerList')}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#6366f1' }]}>
                    <Users size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('sidebar.users')}</Text>
                </TouchableOpacity>

                {/* Persetujuan */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('PendingRegistrations')}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#f59e0b' }]}>
                    <ClipboardCheck size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('sidebar.approvals') || 'Persetujuan'}</Text>
                </TouchableOpacity>

                {/* Tagihan */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('UnpaidBills')}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#f59e0b' }]}>
                    <CreditCard size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('sidebar.billing')}</Text>
                </TouchableOpacity>

                {/* Broadcast */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Broadcast')}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#f43f5e' }]}>
                    <Megaphone size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('sidebar.broadcast')}</Text>
                </TouchableOpacity>

                {/* Laporan */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('FinancialReport')}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#8b5cf6' }]}>
                    <FileText size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('financial.title') || 'Laporan'}</Text>
                </TouchableOpacity>

                {/* System Users */}
                <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SystemUsers')}>
                  <View style={[styles.gridIconBox, { backgroundColor: '#06b6d4' }]}>
                    <Shield size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{t('appSettings.systemUsers')}</Text>
                </TouchableOpacity>
              </View>
           </View>



           {/* Section: Recent Transactions — sama persis dengan web RecentTransactions */}
           <View style={styles.section}>
             <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View>
                  <Text style={styles.sectionTitle}>{t('dashboard.recentInvoices') || 'Invoice Terbaru'}</Text>
                  <Text style={styles.sectionSubtitle}>{t('dashboard.latestPaid') || 'Transaksi terbayar terakhir'}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('FinancialReport')}>
                  <Text style={styles.seeAll}>{t('dashboard.seeAll') || 'Semua'} <ChevronRight size={14} color="#2563eb" /></Text>
                </TouchableOpacity>
             </View>
             
             <View style={styles.glassCard}>
               {(stats?.recentTransactions || []).length > 0 ? (
                 stats.recentTransactions.slice(0, 5).map((item: any) => (
                   <View key={item.id} style={styles.transactionItem}>
                     {/* Avatar inisial — sama dengan web */}
                     <View style={styles.txAvatarCircle}>
                       <Text style={styles.txAvatarText}>
                         {item.customerName ? String(item.customerName).charAt(0).toUpperCase() : '?'}
                       </Text>
                     </View>
                     <View style={{ flex: 1, minWidth: 0 }}>
                       <Text style={styles.transactionCustomerName} numberOfLines={1}>{item.customerName}</Text>
                       {item.invoiceNumber && (
                         <Text style={styles.txInvoiceNumber}>{item.invoiceNumber}</Text>
                       )}
                       <View style={styles.txMethodRow}>
                         <ArrowUpRight size={10} color="#10b981" />
                         <Text style={styles.txMethodText}>{(item.method || 'CASH').toUpperCase()}</Text>
                       </View>
                     </View>
                     <View style={{ alignItems: 'flex-end' }}>
                       <Text style={styles.transactionAmount}>Rp {(item.amount || 0).toLocaleString('id-ID')}</Text>
                       <Text style={styles.transactionDate}>
                         {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                       </Text>
                     </View>
                   </View>
                 ))
               ) : (
                   <Text style={styles.noData}>{t('dashboard.noRecentTransactions') || 'Belum ada transaksi'}</Text>
               )}
             </View>
           </View>


           {/* Settings & Logout (Paling Bawah) */}
            <View style={{ marginTop: 10, paddingBottom: 40, gap: 12 }}>
              <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: COLORS.slate[500] }]} onPress={() => navigation.navigate('SettingsTab')}>
                 <View style={[styles.menuListIconWrapper, { backgroundColor: COLORS.slate[100] }]}>
                    <Settings size={22} color={COLORS.slate[600]} />
                 </View>
                 <View style={styles.menuListTextWrapper}>
                    <Text style={styles.menuListTitle}>{t('sidebar.settings')}</Text>
                    <Text style={styles.menuListSubtitle}>{t('dashboard.systemAppConfig')}</Text>
                 </View>
                 <ChevronRight size={20} color={COLORS.slate[300]} />
              </TouchableOpacity>

                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: COLORS.error }]} onPress={() => {
                   showAlert({
                     title: t('profile.logoutConfirmTitle'),
                     message: t('profile.logoutConfirmMsg'),
                     type: 'warning',
                     confirmText: t('profile.logoutBtn'),
                     onConfirm: () => logout()
                   });
                }}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: COLORS.error + '15' }]}>
                    <LogOut size={22} color={COLORS.error} />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('common.logout') || 'Keluar'}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.endSessionNow')}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.slate[300]} />
               </TouchableOpacity>
            </View>

        </View>
       </ScrollView>

       {loadingStats && !refreshing && (
         <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
         </View>
       )}
     </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScrollView: {
    width: '100%',
    flex: 1,
  },
  customHeaderContainer: {
    width: '100%',
    position: 'relative',
    // borderBottomRightRadius: 30,
    // borderBottomLeftRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    // borderBottomRightRadius: 30,
    // borderBottomLeftRadius: 30,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Dark overlap for readability
  },
  headerContent: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarContainer: {
    position: 'absolute',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarTouch: {
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontWeight: '900',
    color: COLORS.white,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 55, // Account for half avatar size plus extra margin
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate[800],
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopColor: 'rgba(241, 245, 249, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 4,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  transactionCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10b981',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noData: {
    padding: 32,
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  menuList: {
    gap: 12,
  },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 20,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopColor: 'rgba(241, 245, 249, 0.6)',
    borderRightColor: 'rgba(241, 245, 249, 0.6)',
    borderBottomColor: 'rgba(241, 245, 249, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuListIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuListTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  menuListTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginBottom: 4,
  },
  menuListSubtitle: {
    fontSize: 13,
    color: COLORS.slate[500],
    fontWeight: '500',
  },
  pendingListLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
  },
  pendingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[900],
    letterSpacing: -0.3,
  },
  pendingInfo: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
    marginTop: 2,
  },
  chartCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  chartBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 1,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  gridIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate[700],
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.slate[600],
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Router Status Card (matches web RouterStatusCard) ─────────────────────
  routerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  routerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routerCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  routerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[800],
    letterSpacing: -0.3,
  },
  routerIdentity: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  routerHost: {
    fontSize: 10,
    color: COLORS.slate[400],
    fontFamily: 'monospace',
    marginTop: 2,
  },
  routerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  routerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.slate[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Transaction List (matches web RecentTransactions) ─────────────────────
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.slate[400],
    fontWeight: '500',
    marginTop: 2,
  },
  txAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563eb',
  },
  txInvoiceNumber: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: COLORS.slate[400],
    marginTop: 2,
  },
  txMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  txMethodText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

