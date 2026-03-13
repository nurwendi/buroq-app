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
  Settings
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={user?.fullName || user?.username} 
        role="SUPERADMIN"
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
              title="Total Admin" 
              value={stats?.adminCount || 0} 
              icon={Shield} 
              color="#2563eb" 
              subtitle="Super & Admin"
            />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CustomerList')} style={{ width: '48%' }}>
            <StatCard 
              title="Total Pelanggan" 
              value={stats?.totalCustomers || 0} 
              icon={Users} 
              color="#10b981" 
              subtitle="Semua Mitra"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SystemUsers')} style={{ width: '48%' }}>
            <StatCard 
              title="Staff/Mitra" 
              value={stats?.systemUserCount || 0} 
              icon={Users} 
              color="#f59e0b" 
              subtitle="Technical & Sales"
            />
          </TouchableOpacity>
          <View style={{ width: '48%' }}>
            <StatCard 
              title="Total Router" 
              value={stats?.routers?.length || 0} 
              icon={Wifi} 
              color="#8b5cf6" 
              subtitle="Node Terkoneksi"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Utama</Text>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CustomerList')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e0f2fe' }]}>
                   <Users size={24} color="#0ea5e9" />
                </View>
                <Text style={styles.menuLabel}>Pelanggan</Text>
             </TouchableOpacity>


             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Settings size={24} color="#64748b" />
                </View>
                <Text style={styles.menuLabel}>Setelan</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SystemUsers')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#dbeafe' }]}>
                   <Shield size={24} color="#2563eb" />
                </View>
                <Text style={styles.menuLabel}>Admin</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AllUsers')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#ecfdf5' }]}>
                   <Users size={24} color="#10b981" />
                </View>
                <Text style={styles.menuLabel}>All Users</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NAT')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f3e8ff' }]}>
                   <Server size={24} color="#a855f7" />
                </View>
                <Text style={styles.menuLabel}>NAS</Text>
             </TouchableOpacity>


             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FinancialReport')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#ffe4e6' }]}>
                   <Activity size={24} color="#e11d48" />
                </View>
                <Text style={styles.menuLabel}>Laporan</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Server Utama</Text>
          <View style={styles.serverCard}>
             <View style={styles.serverHeader}>
                <Server size={20} color="#2563eb" />
                <Text style={styles.serverTitle}>Buroq Backend Core</Text>
             </View>
             
             <ProgressMeter 
                label="CPU Load" 
                value={stats.serverCpuLoad || 0} 
                color={stats.serverCpuLoad > 80 ? '#ef4444' : '#2563eb'} 
             />
             
             <ProgressMeter 
                label="RAM Usage" 
                value={memUsagePercent} 
                color={memUsagePercent > 80 ? '#f59e0b' : '#10b981'} 
             />
             <Text style={styles.memDetails}>
                Used: {formatMemory(stats.serverMemoryUsed)} / {formatMemory(stats.serverMemoryTotal)}
             </Text>

             {systemInfo && (
               <View style={styles.systemSpecs}>
                 <View style={styles.specItem}>
                   <Text style={styles.specLabel}>Platform</Text>
                   <Text style={styles.specValue}>{systemInfo.platform} ({systemInfo.type})</Text>
                 </View>
                 <View style={styles.specItem}>
                   <Text style={styles.specLabel}>Processor</Text>
                   <Text style={styles.specValue} numberOfLines={1}>{systemInfo.cpu?.model}</Text>
                 </View>
                 <View style={styles.specItem}>
                   <Text style={styles.specLabel}>Cores / Speed</Text>
                   <Text style={styles.specValue}>{systemInfo.cpu?.cores} Cores @ {systemInfo.cpu?.speed} MHz</Text>
                 </View>
               </View>
             )}
          </View>
        </View>

        {(ownerStats || []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statistik Owner (Mitra)</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SystemUsers')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
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
                         <Text style={styles.ownerStatLabel}>Active</Text>
                      </View>
                      <View style={styles.ownerStatDivider} />
                      <View style={styles.ownerStatItem}>
                         <Text style={styles.ownerStatValue}>{stat.offline}</Text>
                         <Text style={[styles.ownerStatLabel, { color: '#ef4444' }]}>Offline</Text>
                      </View>
                      <View style={styles.ownerStatDivider} />
                      <View style={styles.ownerStatItem}>
                         <Text style={styles.ownerStatValue}>{stat.total}</Text>
                         <Text style={styles.ownerStatLabel}>Total</Text>
                      </View>
                    </View>
                 </View>
               ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kesehatan Router</Text>
            <Activity size={18} color="#10b981" />
          </View>
          
          <View style={styles.routerList}>
            {(stats?.routers || []).map((router: any) => (
              <View key={router.id || Math.random().toString()} style={styles.routerItem}>
                <View style={styles.routerLeft}>
                  <View style={[styles.statusDot, { backgroundColor: (router.status === 'online' || router.online) ? '#10b981' : '#ef4444' }]} />
                  <View>
                    <Text style={styles.routerName}>{router.name || 'Unknown Router'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.routerHost}>{router.host || '-'}</Text>
                      <View style={styles.ownerBadgeSmall}>
                        <Text style={styles.ownerBadgeText}>
                          {(ownerStats || []).find(o => o.id === router.ownerId)?.owner || 'Global'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {(router.status === 'online' || router.online) ? (
                  <View style={styles.routerStats}>
                    <View style={styles.miniStat}>
                       <Cpu size={12} color="#64748b" />
                       <Text style={styles.miniStatText}>{router.cpuLoad || 0}%</Text>
                    </View>
                    <View style={styles.miniStat}>
                       <Database size={12} color="#64748b" />
                       <Text style={styles.miniStatText}>{router.memoryTotal > 0 ? Math.round(((router.memoryUsed || 0) / router.memoryTotal) * 100) : 0}%</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.offlineText}>OFFLINE</Text>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 10,
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
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 15, // Gap between items
  },
  menuItem: {
    width: '30%', // 3 columns
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
    borderColor: '#f1f5f9',
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
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  serverCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  serverTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  meterContainer: {
    marginBottom: 16,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  meterValue: {
    fontSize: 13,
    fontWeight: 'bold',
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
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: -8,
  },
  routerList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
  },
  routerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  routerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  routerHost: {
    fontSize: 12,
    color: '#94a3b8',
  },
  routerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  offlineText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCircle: {
    alignItems: 'center',
    width: 80,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  systemSpecs: {
    marginTop: 16,
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
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    maxWidth: '70%',
  },
  seeAllText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  ownerScroll: {
    gap: 12,
    paddingRight: 24,
  },
  ownerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    width: 180, // Slightly wider for 3 columns
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ownerInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ownerInitialText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  ownerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  ownerStatItem: {
    alignItems: 'center',
  },
  ownerStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  ownerStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  ownerStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  ownerBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ownerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
});
