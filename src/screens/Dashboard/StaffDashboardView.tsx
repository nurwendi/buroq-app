import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Platform,
  Image,
  StatusBar
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
  Wifi,
  Activity
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import GradientHeader from '../../components/GradientHeader';
import PppoePieChart from '../../components/PppoePieChart';
import { useLanguage } from '../../context/LanguageContext';

export default function StaffDashboardView() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
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
        apiClient.get('/api/billing/stats'),
        apiClient.get('/api/pppoe/active').catch(() => ({ data: [] }))
      ]);

      const statsData = statsRes.data || {};
      setStats(statsData);

      // Calculate real online status
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
        role="STAFF / PARTNER"
        userAvatar={resolveUrl(user?.avatar)}
      />
      <ScrollView 
        style={styles.fullScrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <PppoePieChart 
          active={onlineCount}
          offline={Math.max(0, (stats?.totalCustomers || 0) - onlineCount)}
          total={stats?.totalCustomers || 0}
          loading={loadingStats}
          onPress={() => navigation.navigate('CustomerList')}
        />

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
            <View style={styles.titleCard}>
              <Activity size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.customerStatus')}</Text>
            </View>
          </View>
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
                icon={Activity} 
                color="#ef4444" 
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <PlusCircle size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.mainMenu')}</Text>
            </View>
          </View>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerList')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Users size={24} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.users')}</Text>
             </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BillingTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <CreditCard size={24} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.billing')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <UserPlus size={24} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('users.addUser')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notification')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Bell size={24} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('notifications.title')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Settings size={24} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.settings')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <TrendingUp size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.recentTransactions')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('FinancialReport')}>
              <Text style={styles.seeAll}>{t('dashboard.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionList}>
            {(stats?.recentTransactions || stats?.transactions || []).length > 0 ? (
              (stats?.recentTransactions || stats?.transactions || []).map((item: any) => (
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
    marginBottom: 20,
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
  transactionList: {
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  transactionDate: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  noData: {
    padding: 32,
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
});

