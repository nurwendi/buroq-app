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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={user?.fullName || user?.username} 
        role="ADMIN"
        userAvatar={resolveUrl(user?.avatar)}
      />
      <ScrollView 
        style={styles.fullScrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Customer Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <Activity size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.customerStatus')}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={{ width: '48%' }}>
              <StatCard 
                title={t('users.all')} 
                value={stats?.totalCustomers || 0} 
                icon={Users} 
                color="#0ea5e9" 
              />
            </View>
            <View style={{ width: '48%' }}>
              <StatCard 
                title={t('users.online')} 
                value={onlineCount} 
                icon={Activity} 
                color="#10b981" 
              />
            </View>
          </View>
        </View>

        {/* Section: Main Menu (Focus on CRUD/Approval) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <PlusCircle size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.mainMenu')}</Text>
            </View>
          </View>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f8fafc' }]}>
                   <Settings size={22} color="#64748b" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.settings')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <UserPlus size={22} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('common.add')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerList')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Users size={22} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.users')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Broadcast')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Megaphone size={22} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.broadcast')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BillingTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <CreditCard size={22} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.billing')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Pending Approval Section */}
        {(stats?.pendingCount > 0 || (stats?.pendingPayments && stats?.pendingPayments.length > 0)) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleCard}>
                <Clock size={18} color="#94a3b8" />
                <Text style={styles.titleCardText}>{t('dashboard.pendingApproval')}</Text>
              </View>
            </View>
            <View style={styles.pendingListLight}>
              {(stats?.pendingPayments || []).slice(0, 3).map((item: any) => (
                <TouchableOpacity 
                   key={item.id} 
                   style={styles.pendingItem}
                   onPress={() => navigation.navigate('UnpaidBills')}
                >
                   <View style={styles.pendingItemLeft}>
                      <View style={styles.pendingIcon}>
                         <Clock size={16} color="#64748b" />
                      </View>
                      <View>
                         <Text style={styles.pendingName}>{item.customerName || item.name}</Text>
                         <Text style={styles.pendingInfo}>{t('dashboard.waitingPayment')}</Text>
                      </View>
                   </View>
                    <ChevronRight size={18} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  fullScrollView: {
    width: '100%',
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleCardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  seeAll: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  pendingListLight: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
  },
  pendingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  pendingInfo: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  routerList: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  routerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
  },
  routerInfoMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  routerStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  routerHost: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  routerPercent: {
    fontSize: 13,
    fontWeight: '800',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
});

