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
  Settings
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
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  
  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/billing/stats');
      setStats(response.data);
    } catch (e) {
      console.error('Failed to fetch staff stats', e);
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

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon}>
          <ArrowUpRight size={16} color="#10b981" />
        </View>
        <View>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>
      <Text style={styles.transactionAmount}>+Rp {item.amount.toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={user?.fullName || user?.username} 
        role="STAFF / PARTNER"
        backgroundImage={resolveUrl(dashboardBgUrl)}
        userAvatar={resolveUrl(user?.avatar)}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <PppoePieChart 
          active={stats?.pppoeActive || 0}
          offline={stats?.pppoeOffline || 0}
          total={stats?.totalCustomers || 0}
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
          <TouchableOpacity onPress={() => navigation.navigate('CustomerList')} style={{ width: '48%' }}>
            <StatCard 
              title={t('dashboard.activeUsers')} 
              value={stats.activeCustomers} 
              icon={CreditCard} 
              color="#f59e0b" 
              subtitle={t('dashboard.online_pppoe')}
            />
          </TouchableOpacity>
          <View style={{ width: '48%' }}>
            <StatCard 
              title={t('dashboard.unpaid')} 
              value={`Rp ${(stats?.totalUnpaid || 0).toLocaleString()}`} 
              icon={Clock} 
              color="#ef4444" 
              subtitle={t('dashboard.unpaidSubtitle')}
            />
          </View>
        </View>

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
                value={stats?.pppoeActive || 0} 
                icon={Users} 
                color="#10b981" 
              />
            </View>
            <View style={{ width: '31%' }}>
              <StatCard 
                title={t('users.offline') || 'Offline'} 
                value={stats?.pppoeOffline || 0} 
                icon={Users} 
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

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PaymentForm')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#ecfdf5' }]}>
                   <CreditCard size={24} color="#10b981" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.pay')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
            <TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 10,
    paddingBottom: 100,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  welcomeInfo: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    backgroundColor: 'rgba(37, 99, 235, 0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
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
  section: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAll: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  transactionDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  noData: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 24,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
});
