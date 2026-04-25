import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
  StatusBar,
  ImageBackground
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Users,
  Shield,
  Server,
  Activity,
  Settings,
  Megaphone,
  ChevronRight,
  PlusCircle,
  LogOut,
  FileText,
  AlertCircle,
  UserPlus,
  Wifi,
  ClipboardCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DonutChart from '../../components/DonutChart';
import { COLORS } from '../../constants/theme';

import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAlert } from '../../context/AlertContext';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';

const { width } = Dimensions.get('window');

const ProgressMeter = ({ value, label, color }: { value: number, label: string, color: string }) => (
  <View style={styles.meterContainer}>
    <View style={styles.meterLabelRow}>
      <Text style={styles.meterLabel}>{label}</Text>
      <Text style={[styles.meterValue, { color }]}>{value}%</Text>
    </View>
    <View style={styles.meterTrack}>
      <View style={[styles.meterFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  </View>
);

export default function SuperadminDashboardView() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>({
    adminCount: 0,
    totalCustomers: 0,
    pppoeActive: 0,
    pppoeOffline: 0,
    cpuLoad: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    serverCpuLoad: 0,
    serverMemoryUsed: 0,
    serverMemoryTotal: 0,
    routers: []
  });
  const [ownerStats, setOwnerStats] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchStats = async () => {
    try {
      // dashboard/stats → router info, pppoeActive/Offline, cpu, memory
      // admin/stats → financial data (grossRevenue, netRevenue), pendingCounts
      const [dashboardRes, adminRes] = await Promise.all([
        apiClient.get('/api/dashboard/stats'),
        apiClient.get('/api/admin/stats').catch(() => ({ data: {} }))
      ]);
      const dashData  = dashboardRes.data || {};
      const adminData = adminRes.data     || {};

      setStats({
        ...dashData,
        // Merge financial + pending from admin/stats
        grossRevenue:              adminData.grossRevenue              || 0,
        netRevenue:                adminData.netRevenue                || 0,
        totalUnpaid:               adminData.totalUnpaid               || 0,
        staffCommission:           adminData.staffCommission           || 0,
        pendingRegistrationsCount: adminData.pendingRegistrationsCount || 0,
        pendingPaymentsCount:      adminData.pendingPaymentsCount      || 0,
        pendingCount:              adminData.pendingCount              || 0,
        // totalCustomers from admin/stats (scoped correctly) fallback to dashboard
        totalCustomers:            adminData.totalCustomers            || dashData.totalCustomers || 0,
        // pppoeActive/Offline from dashboard/stats (most accurate for superadmin)
        pppoeActive:               dashData.pppoeActive  || 0,
        pppoeOffline:              dashData.pppoeOffline || 0,
      });
    } catch (e: any) {
      console.error('Failed to fetch superadmin stats', e);
      showAlert({
        title: t('common.error') || 'Error',
        message: e.response?.data?.error || t('common.fetchError') || 'Failed to fetch dashboard statistics.',
        type: 'error'
      });
    }
  };

  const fetchOwnerStats = async () => {
    try {
      const response = await apiClient.get('/api/admin/stats/owners');
      if (Array.isArray(response.data)) {
        setOwnerStats(response.data);
      }
    } catch (e) {
      console.error('Failed to fetch owner stats', e);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await apiClient.get('/api/system/info');
      setSystemInfo(response.data);
    } catch (e) {
      console.error('Failed to fetch system info', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/app-settings');
      if (res.data.dashboardBgUrl) setDashboardBgUrl(res.data.dashboardBgUrl);
      if (res.data.loginBgUrl) setLoginBgUrl(res.data.loginBgUrl);
    } catch (e) {
      console.log('Failed to fetch settings');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchOwnerStats(),
        fetchSystemInfo(),
        fetchSettings()
      ]);
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchOwnerStats(),
      fetchSystemInfo(),
      fetchSettings()
    ]);
    setRefreshing(false);
  };

  const formatMemory = (bytes: number) => {
    if (!bytes) return '0 GB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  if (loading && !stats.adminCount && !ownerStats.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '600' }}>{t('common.loading') || 'Loading Dashboard...'}</Text>
      </View>
    );
  }

  const memUsagePercent = stats?.serverMemoryTotal > 0 
    ? Math.round((stats.serverMemoryUsed / stats.serverMemoryTotal) * 100) 
    : 0;

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
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />
        )}
      </View>

      <ScrollView 
        style={styles.fullScrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
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
             <View style={[styles.headerBg, { backgroundColor: '#0f172a' }]} />
          )}
          
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
             <View>
                <Text style={styles.welcomeText}>{t('dashboard.welcome')}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>{user?.fullName || user?.username}</Text>
             </View>
             <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>SUPERADMIN</Text>
             </View>
          </View>
          
          {/* Overlapping Avatar */}
          <View style={[styles.avatarContainer, { bottom: -(avatarSize / 2), left: 24 }]}>
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

          {/* Section: Server Status */}
          <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('dashboard.serverStatus')}</Text>
             </View>
             <View style={styles.glassCard}>
                <View style={styles.serverHeaderRow}>
                   <Activity size={18} color="#475569" />
                   <Text style={styles.serverHeaderTitle}>Backend Core</Text>
                </View>
                
                <ProgressMeter 
                   label={t('dashboard.cpuLoad')} 
                   value={stats?.serverCpuLoad || 0} 
                   color={(stats?.serverCpuLoad || 0) > 80 ? '#ef4444' : '#2563eb'} 
                />
                
                <ProgressMeter 
                   label={t('dashboard.ramUsage')} 
                   value={memUsagePercent} 
                   color={memUsagePercent > 80 ? '#f59e0b' : '#10b981'} 
                />
                <Text style={styles.memDetails}>
                   {t('dashboard.used')}: {formatMemory(stats?.serverMemoryUsed || 0)} / {formatMemory(stats?.serverMemoryTotal || 0)}
                </Text>

                {systemInfo && (
                  <View style={styles.systemSpecs}>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>{t('dashboard.platform')}</Text>
                      <Text style={styles.specValue}>{systemInfo.platform}</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>{t('dashboard.processor')}</Text>
                      <Text style={styles.specValue} numberOfLines={1}>{systemInfo.cpu?.model}</Text>
                    </View>
                  </View>
                )}
             </View>
          </View>

          {/* Section: Customer Status — Donut Chart */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate('CustomerList')}
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

          {/* Section: Owner Statistics */}
          {(ownerStats || []).length > 0 && (
            <View style={[styles.section, { marginBottom: 20 }]}>
              <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.sectionTitle}>{t('dashboard.ownerStats')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SystemUsers')}>
                  <Text style={styles.seeAllText}>{t('dashboard.seeAll')} <ChevronRight size={14} color="#2563eb" /></Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ownerScroll}>
                 {(ownerStats || []).map((stat) => (
                   <View key={stat.id} style={styles.glassCardSmall}>
                      <View style={styles.ownerInitialWrapper}>
                        <Text style={styles.ownerInitialText}>{(stat.owner || 'U').charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.ownerName} numberOfLines={1}>{stat.owner || 'Unknown'}</Text>
                      <View style={styles.ownerStatsRow}>
                        <View style={styles.ownerStatItem}>
                           <Text style={styles.ownerStatValue}>{stat.active}</Text>
                           <Text style={styles.ownerStatLabel}>{t('dashboard.active')}</Text>
                        </View>
                        <View style={styles.ownerStatDivider} />
                        <View style={styles.ownerStatItem}>
                           <Text style={[styles.ownerStatValue, { color: '#ef4444' }]}>{stat.offline}</Text>
                           <Text style={[styles.ownerStatLabel, { color: '#ef4444' }]}>{t('dashboard.offline')}</Text>
                        </View>
                      </View>
                   </View>
                 ))}
              </ScrollView>
            </View>
          )}

          {/* Section: Router Status (Superadmin) */}
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
                    <View key={router.id} style={[styles.routerCard, { borderLeftColor: isOnline ? '#2563eb' : '#ef4444', borderLeftWidth: 4 }]}>
                      <View style={styles.routerCardHeader}>
                        <View style={styles.routerCardLeft}>
                          <View style={[styles.routerIconBox, { backgroundColor: isOnline ? '#eff6ff' : '#fff1f2' }]}>
                            <Activity size={18} color={isOnline ? '#2563eb' : '#ef4444'} />
                          </View>
                          <View>
                            <Text style={styles.routerName}>{router.name || 'Router'}</Text>
                            {isOnline && router.identity && (
                              <Text style={styles.routerIdentity}>{router.identity}</Text>
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

          {/* Section: Quick Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('dashboard.customerStatus')}</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={{ width: '48%' }}>
                <StatCard 
                  title={t('dashboard.totalAdmin')} 
                  value={stats?.adminCount || 0} 
                  icon={Shield} 
                  color="#2563eb" 
                />
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('SuperadminCustomerList')} style={{ width: '48%' }}>
                <StatCard 
                  title={t('dashboard.allCustomers') || 'Semua Pelanggan'} 
                  value={stats?.totalCustomers || 0} 
                  icon={Users} 
                  color="#10b981" 
                />
              </TouchableOpacity>
              
              <View style={{ width: '100%', flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('UnpaidBills')}>
                  <StatCard 
                    title={t('financial.unpaid') || 'Piutang Global'} 
                    value={stats?.totalUnpaid || 0} 
                    icon={AlertCircle} 
                    color="red" 
                    subtitle={t('billing.globalReceivables') || 'Total Piutang Sistem'}
                    isCurrency
                  />
                </TouchableOpacity>

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
              </View>
            </View>
          </View>

          {/* Section: Main Menu (List Berwarna) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('dashboard.mainMenu')}</Text>
            </View>
            <View style={styles.menuList}>
               
               {/* Customers */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#2563eb' }]} onPress={() => navigation.navigate('SuperadminCustomerList')}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#2563eb15' }]}>
                     <Users size={22} color="#2563eb" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('sidebar.users') || 'Pelanggan'}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.viewManageCustomers')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>

               {/* All Users */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#10b981' }]} onPress={() => navigation.navigate('AllUsers')}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#10b98115' }]}>
                     <Shield size={22} color="#10b981" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('sidebar.allUsers') || 'Semua Pengguna'}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.allSystemUsers')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>

               {/* Broadcast */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#db2777' }]} onPress={() => navigation.navigate('Broadcast')}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#db277715' }]}>
                     <Megaphone size={22} color="#db2777" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('sidebar.broadcast') || 'Broadcast Pesan'}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.broadcastMassMessage')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>

               {/* Approvals */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#f59e0b' }]} onPress={() => navigation.navigate('PendingRegistrations')}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#f59e0b15' }]}>
                     <ClipboardCheck size={22} color="#f59e0b" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('sidebar.approvals') || 'Persetujuan User'}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.awaitingValidation')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>

               {/* Report */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#8b5cf6' }]} onPress={() => navigation.navigate('FinancialReport')}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#8b5cf615' }]}>
                     <FileText size={22} color="#8b5cf6" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('financial.title') || 'Laporan Keuangan'}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.viewEarningsPerformance')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>
               
            </View>
          </View>

          {/* Settings & Logout (Paling Bawah) */}
          <View style={{ marginTop: 10, paddingBottom: 40, gap: 12 }}>
            <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#64748b' }]} onPress={() => navigation.navigate('SettingsTab')}>
               <View style={[styles.menuListIconWrapper, { backgroundColor: '#f1f5f9' }]}>
                  <Settings size={22} color="#64748b" />
               </View>
               <View style={styles.menuListTextWrapper}>
                  <Text style={styles.menuListTitle}>{t('sidebar.settings')}</Text>
                  <Text style={styles.menuListSubtitle}>{t('dashboard.mainSystemConfig')}</Text>
               </View>
               <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#ef4444' }]} onPress={() => {
                showAlert({
                  title: t('profile.logoutConfirmTitle'),
                  message: t('profile.logoutConfirmMsg'),
                  type: 'warning',
                  confirmText: t('profile.logoutBtn'),
                  onConfirm: () => logout()
                });
            }}>
               <View style={[styles.menuListIconWrapper, { backgroundColor: '#ef444415' }]}>
                  <LogOut size={22} color={'#ef4444'} />
               </View>
               <View style={styles.menuListTextWrapper}>
                  <Text style={styles.menuListTitle}>{t('common.logout') || 'Keluar'}</Text>
                  <Text style={styles.menuListSubtitle}>{t('dashboard.endSessionNow')}</Text>
               </View>
               <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

        </View>
       </ScrollView>

       {loading && !refreshing && (
         <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={'#0f172a'} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  fullScrollView: {
    width: '100%',
    flex: 1,
  },
  customHeaderContainer: {
    width: '100%',
    position: 'relative',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  roleBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  roleBadgeText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarContainer: {
    position: 'absolute',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    borderColor: '#ffffff',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontWeight: '900',
    color: '#ffffff',
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
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '700',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  glassCardSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    width: 220,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 16,
    marginBottom: 16, // For shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  serverHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginLeft: 10,
    letterSpacing: -0.5,
  },
  meterContainer: {
    marginBottom: 20,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  meterValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  meterTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  memDetails: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: -12,
    fontWeight: '600',
  },
  systemSpecs: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    maxWidth: '70%',
    textAlign: 'right',
  },
  ownerScroll: {
    paddingLeft: 4,
  },
  ownerInitialWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerInitialText: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 20,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  ownerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 14,
  },
  ownerStatItem: {
    alignItems: 'center',
  },
  ownerStatValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  ownerStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  ownerStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
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
        shadowColor: '#000',
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
    color: '#0f172a',
    marginBottom: 4,
  },
  chartCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  chartBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 1,
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
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },
  menuListSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },

  // ── Router Status Card ─────────────────────
  routerCard: {
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
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
    color: '#94a3b8',
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
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
