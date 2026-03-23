import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Users, 
  Shield, 
  Server, 
  Wifi, 
  Bell,
  Cpu,
  Database,
  ChevronRight,
  PlusCircle,
  Activity,
  CreditCard,
  Settings,
  Megaphone,
  Router
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../api/client';
import GradientHeader from '../../components/GradientHeader';
import StatCard from '../../components/StatCard';
import PppoePieChart from '../../components/PppoePieChart';
import { ImageBackground } from 'react-native';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [ownerStats, setOwnerStats] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  
  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (e) {
      console.error('Failed to fetch superadmin stats', e);
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
      if (res.data.dashboardBgUrl) {
        setDashboardBgUrl(res.data.dashboardBgUrl);
      }
    } catch (e) {
      console.log('Failed to fetch settings');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOwnerStats();
    fetchSystemInfo();
    fetchSettings();
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

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const memUsagePercent = stats.serverMemoryTotal > 0 
    ? Math.round((stats.serverMemoryUsed / stats.serverMemoryTotal) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={user?.fullName || user?.username} 
        role="SUPERADMIN"
        backgroundImage={resolveUrl(dashboardBgUrl)}
        userAvatar={resolveUrl(user?.avatar)}
      />
      <ScrollView 
        style={styles.fullScrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Server Status (Paling Atas) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <Server size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.serverStatus')}</Text>
            </View>
          </View>
          <View style={styles.serverCard}>
             <View style={styles.serverHeader}>
                <Activity size={18} color="#475569" />
                <Text style={styles.serverTitle}>Backend Core</Text>
             </View>
             
             <ProgressMeter 
                label={t('dashboard.cpuLoad')} 
                value={stats.serverCpuLoad || 0} 
                color={stats.serverCpuLoad > 80 ? '#ef4444' : '#2563eb'} 
             />
             
             <ProgressMeter 
                label={t('dashboard.ramUsage')} 
                value={memUsagePercent} 
                color={memUsagePercent > 80 ? '#f59e0b' : '#10b981'} 
             />
             <Text style={styles.memDetails}>
                {t('dashboard.used')}: {formatMemory(stats.serverMemoryUsed)} / {formatMemory(stats.serverMemoryTotal)}
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

        {/* Section: Owner Statistics */}
        {(ownerStats || []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleCard}>
                <Users size={18} color="#94a3b8" />
                <Text style={styles.titleCardText}>{t('dashboard.ownerStats')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('SystemUsers')}>
                <Text style={styles.seeAllText}>{t('dashboard.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ownerScroll}>
               {(ownerStats || []).map((stat) => (
                 <View key={stat.id} style={styles.ownerCard}>
                    <View style={styles.ownerInitial}>
                      <Text style={styles.ownerInitialText}>{stat.owner.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.ownerName} numberOfLines={1}>{stat.owner}</Text>
                    <View style={styles.ownerStatsRow}>
                      <View style={styles.ownerStatItem}>
                         <Text style={styles.ownerStatValue}>{stat.active}</Text>
                         <Text style={styles.ownerStatLabel}>{t('dashboard.active')}</Text>
                      </View>
                      <View style={styles.ownerStatDivider} />
                      <View style={styles.ownerStatItem}>
                         <Text style={styles.ownerStatValue}>{stat.offline}</Text>
                         <Text style={[styles.ownerStatLabel, { color: '#ef4444' }]}>{t('dashboard.offline')}</Text>
                      </View>
                    </View>
                 </View>
               ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Quick Stats */}
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
                title={t('dashboard.totalAdmin')} 
                value={stats?.adminCount || 0} 
                icon={Shield} 
                color="#2563eb" 
              />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CustomerList')} style={{ width: '48%' }}>
              <StatCard 
                title={t('dashboard.totalUsers')} 
                value={stats?.totalCustomers || 0} 
                icon={Users} 
                color="#10b981" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Main Menu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <PlusCircle size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.mainMenu')}</Text>
            </View>
          </View>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Settings size={22} color="#64748b" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.settings')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AllUsers')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#ecfdf5' }]}>
                   <PlusCircle size={22} color="#10b981" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.allUsers')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Broadcast')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fdf2f8' }]}>
                   <Megaphone size={22} color="#db2777" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.broadcast')}</Text>
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
  seeAllText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  serverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  serverTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginLeft: 12,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  meterValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  meterTrack: {
    height: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  meterFill: {
    height: '100%',
    borderRadius: 5,
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
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 14,
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
  },
  ownerScroll: {
    gap: 16,
    paddingRight: 20,
  },
  ownerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    width: 220,
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
  ownerInitial: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  ownerInitialText: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 22,
  },
  ownerName: {
    fontSize: 16,
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
    paddingVertical: 12,
    borderRadius: 16,
  },
  ownerStatItem: {
    alignItems: 'center',
  },
  ownerStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  ownerStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  ownerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
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
  routerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  routerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusDot: {
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
  miniStatText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '800',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
