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
  TrendingUp, 
  CreditCard, 
  Bell,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Users,
  UserPlus,
  Settings,
  ChevronRight,
  Activity,
  LogOut,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { resolveUrl } from '../../utils/url';

const { width } = Dimensions.get('window');

export default function StaffDashboardView() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    activeCustomers: 0,
    todaysRevenue: 0,
    pendingCount: 0,
    totalUnpaid: 0,
    transactions: [] as any[],
    recentTransactions: [] as any[],
    pppoeActive: 0,
    pppoeOffline: 0,
    totalCustomers: 0
  });
  const [onlineCount, setOnlineCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const [statsRes, activeRes] = await Promise.all([
        apiClient.get('/api/billing/stats'),
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
      console.error('Failed to fetch staff stats', e);
    } finally {
      setLoadingStats(false);
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
    fetchStats();
    fetchSettings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await fetchSettings();
    setRefreshing(false);
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
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 250, 252, 0.65)' }} />
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
             <View style={[styles.headerBg, { backgroundColor: '#3b82f6' }]} />
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
                <Bell size={20} color="#ffffff" />
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

          <View style={styles.statsGrid}>
            <View style={{ width: '48%' }}>
              <StatCard 
                title={t('dashboard.revenueTotal')} 
                value={`Rp ${(stats?.totalRevenue || 0).toLocaleString()}`} 
                icon={TrendingUp} 
                color="#2563eb" 
                subtitle={t('dashboard.totalCumulative')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <StatCard 
                title={t('dashboard.thisMonth')} 
                value={`Rp ${(stats?.thisMonthRevenue || 0).toLocaleString()}`} 
                icon={TrendingUp} 
                color="#10b981" 
                subtitle={t('dashboard.thisMonthRevenueDesc')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dashboard.customerStatus')}</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={{ width: '48%' }}>
                <StatCard 
                  title={t('users.all') || 'Semua'} 
                  value={stats?.totalCustomers || 0} 
                  icon={Users} 
                  color="#0ea5e9" 
                />
              </View>
              <View style={{ width: '48%' }}>
                <StatCard 
                  title={t('users.online') || 'Online'} 
                  value={onlineCount} 
                  icon={Activity} 
                  color="#10b981" 
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
               
               {/* Add Customer */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#2563eb' }]} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#2563eb15' }]}>
                     <UserPlus size={22} color="#2563eb" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('users.addUser')}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.manageNewCustomer')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>

               {/* Customers */}
               <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#10b981' }]} onPress={() => navigation.navigate('CustomerList')}>
                  <View style={[styles.menuListIconWrapper, { backgroundColor: '#10b98115' }]}>
                     <Users size={22} color="#10b981" />
                  </View>
                  <View style={styles.menuListTextWrapper}>
                     <Text style={styles.menuListTitle}>{t('sidebar.users')}</Text>
                     <Text style={styles.menuListSubtitle}>{t('dashboard.viewManageCustomers')}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
               </TouchableOpacity>

                {/* Billing */}
                <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#f59e0b' }]} onPress={() => navigation.navigate('BillingTab')}>
                   <View style={[styles.menuListIconWrapper, { backgroundColor: '#f59e0b15' }]}>
                      <CreditCard size={22} color="#f59e0b" />
                   </View>
                   <View style={styles.menuListTextWrapper}>
                      <Text style={styles.menuListTitle}>{t('sidebar.billing')}</Text>
                      <Text style={styles.menuListSubtitle}>{t('dashboard.manageBillingPayments')}</Text>
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

          {/* Section: Recent Transactions */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
               <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
               <TouchableOpacity onPress={() => navigation.navigate('FinancialReport')}>
                 <Text style={styles.seeAll}>{t('dashboard.seeAll')} <ChevronRight size={14} color="#2563eb" /></Text>
               </TouchableOpacity>
            </View>
            
            <View style={styles.glassCard}>
              {(stats?.recentTransactions || stats?.transactions || []).length > 0 ? (
                (stats?.recentTransactions || stats?.transactions || []).slice(0, 5).map((item: any) => (
                  <View key={item.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIcon}>
                        <ArrowUpRight size={16} color="#10b981" />
                      </View>
                      <View>
                        <Text style={styles.customerName}>{item.customerName}</Text>
                        <Text style={styles.transactionDate}>
                          {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>Rp {item.amount.toLocaleString()}</Text>
                  </View>
                ))
              ) : (
                  <Text style={styles.noData}>{t('dashboard.noRecentTransactions')}</Text>
              )}
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
                  <Text style={styles.menuListSubtitle}>{t('dashboard.accountSettingsPrefs')}</Text>
               </View>
               <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuListItem, { borderLeftColor: '#ef4444' }]} onPress={() => logout()}>
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
    // borderBottomRightRadius: 30,
    // borderBottomLeftRadius: 30,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
    marginBottom: 20,
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
  menuListSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
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
  customerName: {
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
});
