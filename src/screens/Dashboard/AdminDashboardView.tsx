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
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Users, 
  UserPlus,
  Megaphone,
  CreditCard,
  Clock,
  ChevronRight,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Shield,
  FileText
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../constants/theme';

export default function AdminDashboardView() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
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
    grossRevenue: 0,
    netRevenue: 0,
    staffCommission: 0,
    totalUnpaid: 0
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
      const [statsRes, activeRes] = await Promise.all([
        apiClient.get('/api/admin/stats'),
        apiClient.get('/api/pppoe/active').catch(() => ({ data: [] }))
      ]);
      
      const statsData = statsRes.data || {};
      setStats(statsData);
      
      const realTimeCount = Array.isArray(activeRes.data) ? activeRes.data.length : 0;
      const proxyCount = statsData.pppoeActive || 0;

      if (realTimeCount > 0) {
        setOnlineCount(realTimeCount);
      } else {
        setOnlineCount(proxyCount);
      }
      
    } catch (e) {
      console.error('Failed to fetch admin stats', e);
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
           
           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('dashboard.financialSummary')}</Text>
             </View>
             <View style={styles.statsGrid}>
               <View style={{ width: '100%', marginBottom: 12 }}>
                 <StatCard 
                   title={t('dashboard.netRevenue') || t('financial.netIncome')} 
                   value={`Rp ${(stats?.netRevenue || 0).toLocaleString()}`} 
                   icon={TrendingUp} 
                   color={COLORS.success} 
                   subtitle={t('dashboard.thisMonth')}
                   isPrimary
                 />
               </View>
               <View style={{ width: '48%' }}>
                 <StatCard 
                   title={t('dashboard.grossRevenue') || t('financial.revenue')} 
                   value={`Rp ${(stats?.grossRevenue || 0).toLocaleString()}`} 
                   icon={CreditCard} 
                   color={COLORS.primary} 
                   subtitle={t('dashboard.thisMonth')}
                 />
               </View>
               <View style={{ width: '48%' }}>
                 <StatCard 
                   title={t('financial.unpaid_tagihan') || 'PIUTANG'} 
                   value={`Rp ${(stats?.totalUnpaid || 0).toLocaleString()}`} 
                   icon={Clock} 
                   color={COLORS.warning} 
                   subtitle={t('dashboard.thisMonth')}
                 />
               </View>
               <View style={{ width: '100%', marginTop: 12 }}>
                 <StatCard 
                   title={t('dashboard.staffCommission') || t('financial.expenses')} 
                   value={`Rp ${(stats?.staffCommission || 0).toLocaleString()}`} 
                   icon={Users} 
                   color={COLORS.error} 
                   subtitle={t('dashboard.thisMonth')}
                 />
               </View>
             </View>
           </View>

           {/* Section: Main Menu (List Berwarna) */}
           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('dashboard.mainMenu')}</Text>
             </View>
             <View style={styles.menuList}>
                {/* Tambah Pelanggan */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: COLORS.primary }]} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: COLORS.primary + '15' }]}>
                      <UserPlus size={22} color={COLORS.primary} />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('common.add')}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.manageNewCustomer')}</Text>
                   </View>
                   <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>

                {/* Pelanggan */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: COLORS.success }]} onPress={() => navigation.navigate('CustomerList')}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: COLORS.success + '15' }]}>
                      <Users size={22} color={COLORS.success} />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('sidebar.users')}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.viewManageCustomers')}</Text>
                   </View>
                   <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>

                {/* Tagihan */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: COLORS.warning }]} onPress={() => navigation.navigate('BillingTab')}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: COLORS.warning + '15' }]}>
                      <CreditCard size={22} color={COLORS.warning} />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('sidebar.billing')}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.manageBillingPayments')}</Text>
                   </View>
                   <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>

                {/* Broadcast */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#ef4444' }]} onPress={() => navigation.navigate('Broadcast')}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: '#ef444415' }]}>
                      <Megaphone size={22} color={'#ef4444'} />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('sidebar.broadcast')}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.broadcastMassMessage')}</Text>
                   </View>
                   <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>

                {/* Laporan */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#8b5cf6' }]} onPress={() => navigation.navigate('FinancialReport')}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: '#8b5cf615' }]}>
                      <FileText size={22} color="#8b5cf6" />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('financial.title') || 'Laporan Keuangan'}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.viewEarningsPerformance')}</Text>
                   </View>
                   <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>

                {/* System Users */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: COLORS.accent || '#0ea5e9' }]} onPress={() => navigation.navigate('SystemUsers')}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: (COLORS.accent || '#0ea5e9') + '15' }]}>
                      <Shield size={22} color={COLORS.accent || '#0ea5e9'} />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('appSettings.systemUsers')}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.manageSystemAccounts')}</Text>
                   </View>
                   <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>
             </View>
           </View>

           {/* Pending Approval Section */}
           {(stats?.pendingCount > 0 || (stats?.pendingPayments && stats?.pendingPayments.length > 0)) && (
             <View style={styles.section}>
               <View style={[styles.sectionHeader, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                 <Clock size={16} color={'#ef4444'} />
                 <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>{t('dashboard.pendingApproval')} ({stats?.pendingCount || 0})</Text>
               </View>
               <View style={styles.pendingListLight}>
                 {(stats?.pendingPayments || []).slice(0, 5).map((item: any) => {
                   const ItemIcon = getPendingIcon(item);
                   return (
                     <TouchableOpacity 
                        key={item.id} 
                        style={styles.pendingItem}
                        onPress={() => item.type === 'payment' ? navigation.navigate('UnpaidBills') : navigation.navigate('AllUsers')}
                     >
                        <View style={styles.pendingItemLeft}>
                           <View style={styles.pendingIcon}>
                              <ItemIcon size={16} color={COLORS.slate[500]} />
                           </View>
                           <View>
                              <Text style={styles.pendingName}>{item.customerName || item.name}</Text>
                              <Text style={styles.pendingInfo}>{getPendingInfo(item)}</Text>
                           </View>
                        </View>
                         <ChevronRight size={18} color={COLORS.slate[400]} />
                     </TouchableOpacity>
                   );
                 })}
               </View>
             </View>
           )}

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

              <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#ef4444' }]} onPress={() => logout()}>
                 <View style={[styles.menuListIconWrapper, { backgroundColor: '#ef444415' }]}>
                    <LogOut size={22} color={'#ef4444'} />
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
});
