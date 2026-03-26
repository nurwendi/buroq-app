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
  Clock,
  LayoutDashboard,
  PlusCircle
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

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={stats?.name || user?.fullName || user?.username} 
        role={t('sidebar.users').toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
      />
      <ScrollView
        style={styles.fullScrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Connection Card */}
        <View style={[styles.statusCard, stats?.session?.active ? styles.statusActive : styles.statusInactive]}>
           <View style={styles.statusInfo}>
              <Activity size={18} color={stats?.session?.active ? '#10b981' : '#ef4444'} />
              <Text style={[styles.statusLabel, { color: stats?.session?.active ? '#065f46' : '#991b1b' }]}>
                {stats?.session?.active ? t('users.online').toUpperCase() : t('users.offline').toUpperCase()}
              </Text>
           </View>
           {stats?.session?.active && (
             <Text style={styles.uptime}>{stats?.session?.uptime || '-'}</Text>
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
            color="#ef4444" 
            subtitle={t('dashboard.unpaidBillsSubtitle')}
          />
          </View>
        </View>

        <TouchableOpacity
           style={[styles.billingCard, stats?.billing?.status === 'unpaid' ? styles.billingUnpaid : styles.billingPaid]}
           activeOpacity={0.7}
           onPress={() => navigation.navigate('PaymentHistory', { username: user?.username, name: stats?.name })}
        >
          <View style={styles.billingHeader}>
             <View style={styles.billingTitleRow}>
                <CreditCard size={22} color={stats?.billing?.status === 'unpaid' ? '#ef4444' : '#10b981'} />
                <Text style={styles.billingTitle}>{t('dashboard.billingStatus')}</Text>
             </View>
             <View style={[styles.billingStatusBadge, { backgroundColor: stats?.billing?.status === 'unpaid' ? '#fef2f2' : '#f0fdf4' }]}>
                <Text style={[styles.billingStatusText, { color: stats?.billing?.status === 'unpaid' ? '#ef4444' : '#10b981' }]}>
                   {stats?.billing?.status === 'unpaid' ? t('dashboard.unpaid') : t('dashboard.paid')}
                </Text>
             </View>
          </View>
          <View style={styles.billingBody}>
             <View style={{ flex: 1 }}>
                <Text style={styles.billingInvoice}>Invoice: {stats?.billing?.invoice || '-'}</Text>
                {stats?.billing?.status === 'unpaid' && (
                  <Text style={styles.billingAmount}>Rp {(stats?.billing?.amount || 0).toLocaleString()}</Text>
                )}
             </View>
             <View style={styles.billingRight}>
                {stats?.billing?.status === 'unpaid' ? (
                  <TouchableOpacity 
                    style={styles.payNowButton}
                    onPress={() => {
                        Alert.alert(
                          t('dashboard.payNow'),
                          t('dashboard.payNowInstructions') || 'Silakan hubungi admin atau gunakan fitur pembayaran otomatis (jika tersedia).',
                          [{ text: 'OK' }]
                        );
                    }}
                  >
                    <Text style={styles.payNowText}>{t('dashboard.payNow') || 'Bayar Sekarang'}</Text>
                  </TouchableOpacity>
                ) : (
                  <ChevronRight size={20} color="#94a3b8" />
                )}
             </View>
          </View>
        </TouchableOpacity>

        {/* WiFi Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <Wifi size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.routerSettings')}</Text>
            </View>
          </View>
          <View style={styles.wifiCard}>
             <View style={styles.wifiHeader}>
                <View style={styles.wifiIconContainer}>
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

        {/* Main Menu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <LayoutDashboard size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.mainMenu')}</Text>
            </View>
          </View>
          <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsTab')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f1f5f9' }]}>
                   <Settings size={22} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>{t('sidebar.settings')}</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleCard}>
              <HelpCircle size={18} color="#94a3b8" />
              <Text style={styles.titleCardText}>{t('dashboard.supportCenter')}</Text>
            </View>
          </View>
          <View style={styles.supportGrid}>
             <TouchableOpacity
                style={styles.supportCard}
                onPress={() => Linking.openURL('tel:08123456789')}
             >
                <View style={[styles.supportIcon, { backgroundColor: '#fdf4ff' }]}>
                   <Phone size={22} color="#d946ef" />
                </View>
                <Text style={styles.supportLabel}>{t('dashboard.csPhone')}</Text>
             </TouchableOpacity>

             <TouchableOpacity
                style={styles.supportCard}
                onPress={() => Linking.openURL('https://wa.me/628123456789')}
             >
                <View style={[styles.supportIcon, { backgroundColor: '#ecfdf5' }]}>
                   <MessageSquare size={22} color="#10b981" />
                </View>
                <Text style={styles.supportLabel}>{t('dashboard.whatsapp')}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.supportCard}>
                <View style={[styles.supportIcon, { backgroundColor: '#f1f5f9' }]}>
                   <HelpCircle size={22} color="#475569" />
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
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 100,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  uptime: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
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
  billingCard: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 32,
    borderWidth: 1,
    backgroundColor: '#ffffff',
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
  billingPaid: {
    borderColor: '#f1f5f9',
  },
  billingUnpaid: {
    borderColor: '#fecaca',
  },
  billingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  billingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  billingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  billingStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billingBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
  },
  billingStatus: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  billingInvoice: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  billingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payNowButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payNowText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  billingAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ef4444',
    marginTop: 4,
  },
  wifiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
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
  wifiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wifiIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  ssidLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  ssidValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  editButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wifiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  securityText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
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
  supportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  supportCard: {
    backgroundColor: '#ffffff',
    flex: 1,
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
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  supportLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    gap: 24,
  },
  modalInputGroup: {
    gap: 10,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 18,
    height: 60,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  passwordHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff7ed',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffedd5',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#c2410c',
    lineHeight: 20,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoBox: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
});
