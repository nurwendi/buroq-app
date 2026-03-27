import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  StatusBar,
  ImageBackground
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
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
  HelpCircle,
  Clock,
  LayoutDashboard,
  LogOut,
  MapPin,
  User as UserIcon
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import { Linking } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { resolveUrl } from '../../utils/url';

const { width } = Dimensions.get('window');

export default function CustomerDashboardView() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [dashboardBgUrl, setDashboardBgUrl] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [latestNotifs, setLatestNotifs] = useState<any[]>([]);
  

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

  const fetchLatestNotifications = async () => {
    try {
      const res = await apiClient.get('/api/notifications?limit=3');
      if (Array.isArray(res.data)) {
        setLatestNotifs(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch latest notifications', e);
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
      if (res.data.dashboardBgUrl) setDashboardBgUrl(res.data.dashboardBgUrl);
      if (res.data.loginBgUrl) setLoginBgUrl(res.data.loginBgUrl);
    } catch (e) {
      console.log('Failed to fetch settings');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDevice();
    fetchSettings();
    fetchLatestNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchDevice(), fetchSettings(), fetchLatestNotifications()]);
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

  const getMonthName = (month: number) => {
    if (month === undefined || month === null) return '';
    const months = [
      t('billing.january') || 'Jan', t('billing.february') || 'Feb', t('billing.march') || 'Mar', 
      t('billing.april') || 'Apr', t('billing.may') || 'Mei', t('billing.june') || 'Jun', 
      t('billing.july') || 'Jul', t('billing.august') || 'Agu', t('billing.september') || 'Sep', 
      t('billing.october') || 'Okt', t('billing.november') || 'Nov', t('billing.december') || 'Des'
    ];
    return months[month] || '';
  };

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

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
            {/* Transparent overlaysamakan dengan background login, tetapi buat lebih transparant */}
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 250, 252, 0.7)' }} />
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }} />
        )}
      </View>

      <ScrollView
        style={styles.fullScrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
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
             <View style={[styles.headerBg, { backgroundColor: '#db2777' }]} />
          )}
          
          <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
             <View style={{ width: 44, height: 44, opacity: 0 }} /> {/* Spacer for centering */}
             <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.welcomeText}>Selamat datang,</Text>
                <Text style={styles.userNameText} numberOfLines={1}>{stats?.name || user?.fullName || user?.username}</Text>
             </View>
             <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notification')}>
                <Bell size={20} color="#ffffff" />
             </TouchableOpacity>
          </View>
          
          {/* Overlapping Avatar */}
          <View style={[styles.avatarContainer, { bottom: -(avatarSize / 2), alignSelf: 'center' }]}>
             <View style={{ ...styles.avatarTouch, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}>
               {user?.avatar ? (
                  <Image source={{ uri: resolveUrl(user.avatar) }} style={styles.avatarImage} />
               ) : (
                  <View style={styles.avatarPlaceholder}>
                     <Text style={[styles.avatarInitial, { fontSize: avatarSize * 0.4 }]}>
                        {(stats?.name || user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                     </Text>
                  </View>
               )}
             </View>
          </View>
        </View>

        {/* Padding Top to accommodate half the avatar height plus spacing */}
        <View style={styles.bodyContent}>

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

          {/* Billing Card */}
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
               <View style={[styles.billingStatusBadge, { backgroundColor: stats?.billing?.status === 'unpaid' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                  <Text style={[styles.billingStatusText, { color: stats?.billing?.status === 'unpaid' ? '#ef4444' : '#10b981' }]}>
                     {stats?.billing?.status === 'unpaid' ? t('dashboard.unpaid') : t('dashboard.paid')}
                  </Text>
               </View>
            </View>
            <View style={styles.billingBody}>
               <View style={{ flex: 1 }}>
                  <Text style={styles.billingInvoice}>Invoice: {stats?.billing?.invoice || '-'}</Text>
                  <View style={styles.periodRow}>
                    <Clock size={12} color="#64748b" />
                    <Text style={styles.periodLabel}>Periode: </Text>
                    <Text style={styles.periodValue}>
                      {getMonthName(stats?.billing?.month)} {stats?.billing?.year || ''}
                    </Text>
                  </View>
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

          {/* Customer Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleCard}>
                <LayoutDashboard size={18} color="#94a3b8" />
                <Text style={styles.titleCardText}>{t('users.customerInfo') || 'INFORMASI PELANGGAN'}</Text>
              </View>
            </View>
            <View style={styles.glassCard}>
              <View style={styles.infoGrid}>
                <View style={[styles.infoCard, { width: '100%' }]}>
                   <View style={styles.infoRowSimple}>
                      <UserIcon size={16} color="#64748b" style={{ marginRight: 8 }} />
                      <Text style={styles.infoLabel}>{t('users.id') || 'ID Pelanggan'}: </Text>
                      <Text style={styles.infoValue}>{stats?.customerId || user?.username || '-'}</Text>
                   </View>
                </View>
                <View style={[styles.infoCard, { width: '100%', marginTop: 12 }]}>
                   <View style={styles.infoRowSimple}>
                      <UserIcon size={16} color="#64748b" style={{ marginRight: 8 }} />
                      <Text style={styles.infoLabel}>{t('common.name') || 'Nama Lengkap'}: </Text>
                      <Text style={styles.infoValue}>{stats?.name || '-'}</Text>
                   </View>
                </View>
                <View style={[styles.infoCard, { width: '100%', marginTop: 12 }]}>
                   <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <MapPin size={16} color="#64748b" style={{ marginRight: 8, marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>{t('users.address') || 'Alamat'}</Text>
                        <Text style={[styles.infoValue, { marginTop: 4 }]}>{stats?.address || '-'}</Text>
                      </View>
                   </View>
                </View>
              </View>
            </View>
          </View>

          {/* Latest Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleCard}>
                <Bell size={18} color="#94a3b8" />
                <Text style={styles.titleCardText}>{t('notifications.title') || 'NOTIFIKASI TERBARU'}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
                <Text style={styles.seeAllText}>{t('dashboard.seeAll') || 'Lihat Semua'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.notificationList}>
               {latestNotifs.length > 0 ? (
                 latestNotifs.map((n) => (
                   <TouchableOpacity 
                      key={n.id} 
                      style={styles.notifItem}
                      onPress={() => navigation.navigate('Notification')}
                   >
                     <View style={[styles.notifDot, !n.isRead && styles.notifDotActive]} />
                     <Text style={[styles.notifTitle, !n.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                       {n.notification?.title || t('notifications.system')}
                     </Text>
                     <ChevronRight size={16} color="#cbd5e1" />
                   </TouchableOpacity>
                 ))
               ) : (
                 <View style={styles.notificationBox}>
                    <Clock size={20} color="#94a3b8" />
                    <Text style={styles.notifPlaceholder}>
                      {t('notifications.noNotifications') || 'Belum ada notifikasi terbaru.'}
                    </Text>
                 </View>
               )}
            </View>
          </View>

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

          {/* Support Center */}
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
            </View>
          </View>

          {/* Logout (Paling Bawah) */}
          <View style={[styles.section, { paddingBottom: 20 }]}>
            <TouchableOpacity style={styles.settingsListButton} onPress={() => logout()}>
               <View style={[styles.supportIconRed, { backgroundColor: '#fef2f2', marginBottom: 0 }]}>
                  <LogOut size={22} color="#ef4444" />
               </View>
               <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.supportLabel, { color: '#ef4444' }]}>{t('common.logout') || 'Keluar'}</Text>
                  <Text style={{ fontSize: 12, color: '#fca5a5', fontWeight: '500' }}>Akhiri sesi aplikasi</Text>
               </View>
               <ChevronRight size={18} color="#fca5a5" />
            </TouchableOpacity>
          </View>

        </View>
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
        shadowColor: 'rgba(0,0,0,0.1)',
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
    bottom: -35,
    left: 24,
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
    paddingTop: 55, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
    backgroundColor: 'rgba(240, 253, 244, 0.85)',
    borderColor: 'rgba(187, 247, 208, 0.8)',
  },
  statusInactive: {
    backgroundColor: 'rgba(254, 242, 242, 0.85)',
    borderColor: 'rgba(254, 202, 202, 0.8)',
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
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopColor: 'rgba(241, 245, 249, 0.6)',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.6)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.7)',
  },
  infoRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  notificationList: {
    gap: 12,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
    gap: 12,
  },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  notifDotActive: {
    backgroundColor: '#3b82f6',
  },
  notifTitle: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  notifTitleUnread: {
    color: '#0f172a',
    fontWeight: '800',
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  notifPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  billingCard: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 32,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  billingPaid: {
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  billingUnpaid: {
    borderColor: 'rgba(254, 202, 202, 0.8)',
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
    backgroundColor: 'rgba(248, 250, 252, 0.6)',
    padding: 16,
    borderRadius: 20,
  },
  billingInvoice: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  periodLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  periodValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '800',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
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
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.7)',
  },
  ssidLabel: {
    fontSize: 13,
    color: '#64748b',
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
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.7)',
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
    borderTopColor: 'rgba(241, 245, 249, 0.6)',
  },
  securityText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },
  supportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  supportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportIconRed: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  settingsListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  cancelText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  modalBody: {
    gap: 20,
  },
  modalInputGroup: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  passwordHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#b45309',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
