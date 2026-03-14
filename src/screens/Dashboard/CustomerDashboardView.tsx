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
  Download, 
  Upload, 
  CreditCard, 
  Wifi, 
  Bell,
  Activity,
  ChevronRight,
  Settings,
  ShieldCheck,
  Zap,
  Phone,
  MessageSquare,
  Plus,
  HelpCircle,
  Clock
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import { Linking } from 'react-native';
import GradientHeader from '../../components/GradientHeader';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function CustomerDashboardView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');

  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const [wifiModalVisible, setWifiModalVisible] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [updatingWifi, setUpdatingWifi] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/customer/stats');
      setStats(response.data);
    } catch (e) {
      console.error('Failed to fetch customer stats', e);
    }
  };

  const fetchDevice = async () => {
    setLoadingDevice(true);
    try {
      const response = await apiClient.get('/api/genieacs/devices');
      if (response.data && response.data.length > 0) {
        const dev = response.data[0];
        setDevice(dev);
        setSsid(dev.wifi_ssid || '');
      }
    } catch (e) {
      console.error('Failed to fetch device info', e);
    } finally {
      setLoadingDevice(false);
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
    fetchDevice();
    fetchSettings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchDevice(), fetchSettings()]);
    setRefreshing(false);
  };

  const handleUpdateWifi = async () => {
    if (password && password.length < 8) {
      Alert.alert('Error', t('dashboard.wifiMin8'));
      return;
    }

    setUpdatingWifi(true);
    try {
      await apiClient.post(`/api/genieacs/devices/${device.id}/wifi`, {
        ssid: ssid,
        password: password
      });
      Alert.alert(t('common.success'), t('dashboard.wifiUpdateSuccess'));
      setWifiModalVisible(false);
      setPassword('');
      fetchDevice();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('dashboard.wifiUpdateError'));
    } finally {
      setUpdatingWifi(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={stats?.name || user?.fullName || user?.username} 
        role={t('sidebar.users').toUpperCase()}
        backgroundImage={resolveUrl(dashboardBgUrl)}
        userAvatar={resolveUrl(user?.avatar)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Connection Card */}
        <View style={[styles.statusCard, stats?.session?.active ? styles.statusActive : styles.statusInactive]}>
           <View style={styles.statusInfo}>
              <Activity size={20} color={stats?.session?.active ? '#10b981' : '#ef4444'} />
              <Text style={[styles.statusLabel, { color: stats?.session?.active ? '#065f46' : '#991b1b' }]}>
                {t('common.status')}: {stats?.session?.active ? t('users.online') : t('users.offline')}
              </Text>
           </View>
           {stats?.session?.active && (
             <Text style={styles.uptime}>{t('dashboard.uptime')}: {stats?.session?.uptime || '-'}</Text>
           )}
        </View>

        <View style={styles.statsGrid}>
          <View style={{ width: '48%' }}>
            <StatCard 
            title={t('dashboard.balance')} 
            value={`Rp ${(stats?.balance || 0).toLocaleString()}`} 
            icon={CreditCard} 
            color="#2563eb"
            subtitle={t('dashboard.balanceSubtitle')}
          />
          </View>
          <View style={{ width: '48%' }}>
          <StatCard 
            title={t('dashboard.unpaidBills')} 
            value={stats?.unpaidBillsCount || 0} 
            icon={Bell} 
            color="#10b981" 
            subtitle={t('dashboard.unpaidBillsSubtitle')}
          />
          </View>
          <View style={{ width: '48%' }}>
          <StatCard 
            title={t('dashboard.subscriptionLength')} 
            value={`${stats?.monthsActive || 0} ${t('dashboard.months')}`} 
            icon={Clock} 
            color="#f59e0b" 
            subtitle={t('dashboard.subscriptionSubtitle')}
          />
          </View>
        </View>

        <TouchableOpacity
           style={[styles.billingCard, stats?.billing?.status === 'unpaid' ? styles.billingUnpaid : styles.billingPaid]}
           activeOpacity={0.7}
           onPress={() => navigation.navigate('PaymentHistory', { username: user?.username, name: stats?.name })}
        >
          <View style={styles.billingHeader}>
             <CreditCard size={24} color={stats?.billing?.status === 'unpaid' ? '#ef4444' : '#10b981'} />
             <Text style={styles.billingTitle}>{t('dashboard.billingStatus')}</Text>
          </View>
          <View style={styles.billingBody}>
             <View>
                <Text style={styles.billingStatus}>
                  {stats?.billing?.status === 'unpaid' ? t('dashboard.unpaid') : t('dashboard.paid')}
                </Text>
                <Text style={styles.billingInvoice}>Invoice: {stats?.billing?.invoice || '-'}</Text>
             </View>
             <View style={styles.billingRight}>
                {stats?.billing?.status === 'unpaid' && (
                  <Text style={styles.billingAmount}>Rp {(stats?.billing?.amount || 0).toLocaleString()}</Text>
                )}
                <ChevronRight size={20} color="#94a3b8" />
             </View>
          </View>
        </TouchableOpacity>

        {/* WiFi Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.routerSettings')}</Text>
          <View style={styles.wifiCard}>
            <View style={styles.wifiHeader}>
              <View style={styles.wifiIcon}>
                <Wifi size={24} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ssidLabel}>{t('dashboard.wifiName')}</Text>
                <Text style={styles.ssidValue}>{ssid || t('common.loading')}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setWifiModalVisible(true)}
              >
                <Settings size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.wifiFooter}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.securityText}>{t('dashboard.securityWpa2')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.supportCenter')}</Text>
          <View style={styles.supportGrid}>
             <TouchableOpacity
                style={styles.supportCard}
                onPress={() => Linking.openURL('tel:08123456789')} // Needs real CS number
             >
                <View style={[styles.supportIcon, { backgroundColor: '#fef3c7' }]}>
                   <Phone size={24} color="#d97706" />
                </View>
                <Text style={styles.supportLabel}>{t('dashboard.csPhone')}</Text>
             </TouchableOpacity>

             <TouchableOpacity
                style={styles.supportCard}
                onPress={() => Linking.openURL('https://wa.me/628123456789')}
             >
                <View style={[styles.supportIcon, { backgroundColor: '#dcfce7' }]}>
                   <MessageSquare size={24} color="#16a34a" />
                </View>
                <Text style={styles.supportLabel}>{t('dashboard.whatsapp')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.supportCard}>
                <View style={[styles.supportIcon, { backgroundColor: '#e0e7ff' }]}>
                   <HelpCircle size={24} color="#4338ca" />
                </View>
                <Text style={styles.supportLabel}>{t('dashboard.guide')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        {!device && !loadingDevice && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t('dashboard.noRouterInfo')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* WiFi Management Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={wifiModalVisible}
        onRequestClose={() => setWifiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('genieacs.editWifiTitle')}</Text>
              <TouchableOpacity onPress={() => setWifiModalVisible(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
               <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('dashboard.wifiName')}</Text>
                  <TextInput 
                    style={styles.modalInput}
                    value={ssid}
                    onChangeText={setSsid}
                    placeholder={t('dashboard.wifiPlaceholder')}
                  />
               </View>

               <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>{t('genieacs.newPassword')}</Text>
                  <TextInput 
                    style={styles.modalInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('dashboard.wifiPassPlaceholder')}
                    secureTextEntry
                  />
                  <Text style={styles.passwordHint}>{t('dashboard.wifiMin8')}</Text>
               </View>

               <View style={styles.warningBox}>
                  <Zap size={16} color="#f59e0b" style={{ marginRight: 8 }} />
                  <Text style={styles.warningText}>
                    {t('dashboard.wifiWarning')}
                  </Text>
               </View>

               <TouchableOpacity 
                 style={styles.saveButton} 
                 onPress={handleUpdateWifi}
                 disabled={updatingWifi}
               >
                 {updatingWifi ? (
                   <ActivityIndicator color="#fff" />
                 ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                 )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  statusInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  uptime: {
    fontSize: 12,
    color: '#065f46',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  billingCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  billingPaid: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  billingUnpaid: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecaca',
  },
  billingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  billingBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingStatus: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  billingInvoice: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  billingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  wifiCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  wifiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  wifiIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ssidLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  ssidValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  wifiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  securityText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  infoBox: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  supportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportCard: {
    backgroundColor: '#fff',
    width: (width - 48 - 24) / 3,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  supportLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 450,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  modalBody: {
    gap: 20,
  },
  modalInputGroup: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  passwordHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#c2410c',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
