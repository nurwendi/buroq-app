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
  Activity, 
  PlusCircle,
  Settings,
  UserPlus,
  Megaphone,
  CreditCard,
  Clock,
  ChevronRight,
  TrendingUp
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import GradientHeader from '../../components/GradientHeader';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../constants/theme';

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
    pendingCount: 0,
    grossRevenue: 0,
    netRevenue: 0,
    staffCommission: 0
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Financial Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <TrendingUp size={18} color={COLORS.slate[400]} />
              <Text style={styles.titleCardText}>{t('dashboard.financialSummary')}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={{ width: '48%' }}>
              <StatCard 
                title={t('dashboard.grossRevenue')} 
                value={`Rp ${(stats?.grossRevenue || 0).toLocaleString()}`} 
                icon={CreditCard} 
                color={COLORS.primary} 
                subtitle={t('dashboard.thisMonth')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <StatCard 
                title={t('dashboard.staffCommission')} 
                value={`Rp ${(stats?.staffCommission || 0).toLocaleString()}`} 
                icon={Users} 
                color={COLORS.warning} 
                subtitle={t('dashboard.thisMonth')}
              />
            </View>
            <View style={{ width: '100%', marginTop: 12 }}>
              <StatCard 
                title={t('dashboard.netRevenue')} 
                value={`Rp ${(stats?.netRevenue || 0).toLocaleString()}`} 
                icon={TrendingUp} 
                color={COLORS.success} 
                subtitle={t('dashboard.thisMonth')}
              />
            </View>
          </View>
        </View>

        {/* Section: Main Menu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <PlusCircle size={18} color={COLORS.slate[400]} />
              <Text style={styles.titleCardText}>{t('dashboard.mainMenu')}</Text>
            </View>
          </View>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.slate[50] }]}>
                   <Settings size={22} color={COLORS.slate[500]} />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.settings')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerForm', { mode: 'add' })}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.slate[100] }]}>
                   <UserPlus size={22} color={COLORS.slate[700]} />
                </View>
                <Text style={styles.menuLabel}>{t('common.add')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerList')}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.slate[100] }]}>
                   <Users size={22} color={COLORS.slate[700]} />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.users')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Broadcast')}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.slate[100] }]}>
                   <Megaphone size={22} color={COLORS.slate[700]} />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.broadcast')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BillingTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.slate[100] }]}>
                   <CreditCard size={22} color={COLORS.slate[700]} />
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
                <Clock size={18} color={COLORS.slate[400]} />
                <Text style={styles.titleCardText}>{t('dashboard.pendingApproval')} ({stats?.pendingCount || 0})</Text>
              </View>
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

        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
    backgroundColor: COLORS.white,
    paddingVertical: 24,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.slate[800],
    textAlign: 'center',
  },
  pendingListLight: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate[900],
    letterSpacing: -0.3,
  },
  pendingInfo: {
    fontSize: 13,
    color: COLORS.slate[400],
    fontWeight: '600',
    marginTop: 2,
  },
});


