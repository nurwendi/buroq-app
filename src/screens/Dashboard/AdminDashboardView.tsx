import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  RefreshControl,
  ImageBackground,
  Platform,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp,
  FileText,
  DollarSign,
  UserPlus,
  Settings,
  Bell,
  ChevronRight,
  Plus,
  Wifi,
  Search,
  PlusCircle,
  CreditCard as CreditCardIcon,
  LayoutDashboard,
  Shield,
  Server,
  Clock,
  Megaphone
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import GradientHeader from '../../components/GradientHeader';
import PppoePieChart from '../../components/PppoePieChart';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminDashboardView() {
  const { user } = useAuth();
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
    pendingCount: 0
  });
  const [onlineCount, setOnlineCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  
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
      
      // Calculate real online status
      // Priority: 
      // 1. Real-time activeRes data length if > 0
      // 2. statsRes.data.pppoeActive if > 0
      // 3. Fallback to 0
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={user?.fullName || user?.username} 
        role="ADMIN"
        backgroundImage={resolveUrl(dashboardBgUrl)}
        userAvatar={resolveUrl(user?.avatar)}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Pie Chart removed per user request */}

        {/* Pending Approval Section (New) */}
        {(stats?.pendingCount > 0 || (stats?.pendingPayments && stats?.pendingPayments.length > 0)) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dashboard.pendingApproval')}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{stats?.pendingCount || stats?.pendingPayments?.length || 0}</Text>
              </View>
            </View>
            <View style={styles.pendingList}>
              {(stats?.pendingPayments || []).slice(0, 3).map((item: any) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.pendingItem}
                  onPress={() => navigation.navigate('UnpaidBills')}
                >
                  <View style={styles.pendingItemLeft}>
                    <View style={styles.pendingIcon}>
                      <Clock size={16} color="#f59e0b" />
                    </View>
                    <View>
                      <Text style={styles.pendingName}>{item.customerName || item.name}</Text>
                      <Text style={styles.pendingInfo}>{t('dashboard.waitingPayment')}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.seeAllPending}
                onPress={() => navigation.navigate('UnpaidBills')}
              >
                <Text style={styles.seeAllPendingText}>{t('dashboard.allBills')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.customerStatus')}</Text>
          <View style={styles.statsGrid}>
            <View style={{ width: '31%' }}>
              <StatCard 
                title={t('users.all') || 'All'} 
                value={stats?.totalCustomers || 0} 
                icon={Users} 
                color="#0ea5e9" 
              />
            </View>
            <View style={{ width: '31%' }}>
              <StatCard 
                title={t('users.online') || 'Online'} 
                value={onlineCount} 
                icon={Activity} 
                color="#10b981" 
              />
            </View>
            <View style={{ width: '31%' }}>
              <StatCard 
                title={t('users.offline') || 'Offline'} 
                value={Math.max(0, (stats?.totalCustomers || 0) - onlineCount)} 
                icon={Wifi} 
                color="#64748b" 
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.mainMenu')}</Text>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerList')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e0f2fe' }]}>
                   <Users size={24} color="#0ea5e9" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.users')}</Text>
             </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BillingTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fdf4ff' }]}>
                   <CreditCard size={24} color="#d946ef" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.billing')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Settings size={24} color="#64748b" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.settings')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#dbeafe' }]}>
                   <PlusCircle size={24} color="#2563eb" />
                </View>
                <Text style={styles.menuLabel}>{t('common.add')}</Text>
             </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AllUsers')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#ecfdf5' }]}>
                   <Users size={24} color="#10b981" />
                </View>
                <Text style={styles.menuLabel}>{t('dashboard.userManagement')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PaymentForm')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fdf4ff' }]}>
                   <CreditCardIcon size={24} color="#d946ef" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.pay')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NAT')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f3e8ff' }]}>
                   <Server size={24} color="#a855f7" />
                </View>
                <Text style={styles.menuLabel}>{t('dashboard.routerManagement')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FinancialReport')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#ffe4e6' }]}>
                   <Activity size={24} color="#e11d48" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.reports')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Broadcast')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fef3c7' }]}>
                   <Megaphone size={24} color="#d97706" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.broadcast')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dashboard.routerHealth')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('NAT')}>
                 <Text style={styles.seeAll}>{t('dashboard.seeAll')}</Text>
              </TouchableOpacity>
           </View>
           <View style={styles.routerList}>
              {(stats?.routers || []).map((router: any) => (
                <View key={router.id} style={styles.routerRow}>
                   <View style={styles.routerInfoMain}>
                      <View style={[styles.routerStatus, { backgroundColor: router.status === 'online' ? '#10b981' : '#ef4444' }]} />
                      <View>
                         <Text style={styles.routerName}>{router.name}</Text>
                         <Text style={styles.routerHost}>{router.host} • {router.identity || '-'}</Text>
                      </View>
                   </View>
                    <Text style={[styles.routerPercent, { color: (router.status === 'online' || router.online) ? '#10b981' : '#ef4444' }]}>
                      {(router.status === 'online' || router.online) ? `${router.cpuLoad || 0}% ${t('dashboard.cpu')}` : t('dashboard.offline').toUpperCase()}
                    </Text>
                </View>
              ))}
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchTextHeader: {
    marginLeft: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 10,
    paddingBottom: 100,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 15,
  },
  menuItem: {
    width: '30%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
     color: '#2563eb',
     fontSize: 14,
     fontWeight: '600',
  },
  routerList: {
     backgroundColor: '#ffffff',
     borderRadius: 20,
     padding: 8,
     borderWidth: 1,
     borderColor: '#e2e8f0',
     shadowColor: '#64748b',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 2,
  },
  routerRow: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     padding: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#f1f5f9',
  },
  routerInfoMain: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
  },
  routerStatus: {
     width: 10,
     height: 10,
     borderRadius: 5,
     marginRight: 14,
  },
  routerName: {
     fontSize: 15,
     color: '#0f172a',
     fontWeight: '700',
  },
  routerHost: {
     fontSize: 12,
     color: '#94a3b8',
     marginTop: 2,
  },
  routerPercent: {
     fontSize: 13,
     fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  pendingBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pendingList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pendingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  pendingInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  seeAllPending: {
    padding: 12,
    alignItems: 'center',
  },
  seeAllPendingText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  }
});

