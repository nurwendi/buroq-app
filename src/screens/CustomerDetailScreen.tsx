import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Linking,
  Alert,
  Platform,
  Modal,
  TextInput,
  Image,
  RefreshControl
} from 'react-native';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Wifi,
  Activity,
  ChevronRight,
  Clock,
  ExternalLink,
  ShieldAlert,
  Edit,
  MessageCircle,
  Cpu,
  RefreshCw,
  Power,
  Terminal,
  Info,
  Save,
  X as CloseIcon,
  Router,
  Users,
  Banknote,
  Globe
} from 'lucide-react-native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { resolveUrl } from '../utils/url';
import { formatBytes } from '../utils/format';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';
import { StatusBar } from 'react-native';

export default function CustomerDetailScreen({ route, navigation }: any) {
  const { customer } = route.params;
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [acsDevice, setAcsDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAcs, setLoadingAcs] = useState(true);

  // WiFi Modal State
  const [wifiModalVisible, setWifiModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wifiForm, setWifiForm] = useState({
    ssid: '',
    password: ''
  });

  const fetchCustomerStats = async () => {
    try {
      const response = await apiClient.get(`/api/customer/stats?customerId=${customer.customerId || customer.username}`);
      setStats(response.data);
    } catch (e) {
      console.error('Failed to fetch detail stats', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcsDevice = async () => {
    try {
      setLoadingAcs(true);
      const username = customer.username || customer.customerId;
      if (!username) return;
      
      const response = await apiClient.get(`/api/genieacs/devices?search=${username}`);
      if (response.data && response.data.length > 0) {
        // Find the device matching this user
        const device = response.data.find((d: any) => 
          d.pppoe_user === username || 
          d.pppoe_user?.includes(username) ||
          d.serial?.includes(username)
        ) || response.data[0];
        setAcsDevice(device);
        setWifiForm({
          ssid: device.ssid || '',
          password: ''
        });
      }
    } catch (e) {
      console.error('Failed to fetch GenieACS data', e);
    } finally {
      setLoadingAcs(false);
    }
  };

  useEffect(() => {
    fetchCustomerStats();
    fetchAcsDevice();
  }, []);

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    } else {
      Alert.alert(t('common.info'), t('users.phoneNotAvailable'));
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
      Linking.openURL(`whatsapp://send?phone=${formattedPhone}`);
    } else {
      Alert.alert(t('common.info'), t('users.whatsappNotAvailable'));
    }
  };

  const handleReboot = async () => {
    if (!acsDevice) return;
    
    Alert.alert(
      t('users.rebootTitle'),
      t('users.rebootConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('users.rebootConfirmBtn'), 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiClient.post('/api/genieacs/reboot', { deviceId: acsDevice.id });
              Alert.alert(t('common.success'), t('users.rebootSuccessMsg'));
            } catch (e) {
              Alert.alert(t('common.error'), t('users.rebootErrorMsg'));
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleDropSession = async () => {
    if (!stats?.session?.active || !stats?.session?.id) return;

    Alert.alert(
      t('users.kickTitle'),
      t('users.kickConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('users.kick'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiClient.delete(`/api/pppoe/active/${stats.session.id}`);
              Alert.alert(t('common.success'), t('users.kickSuccess'));
              fetchCustomerStats(); // Refresh stats
            } catch (e) {
              Alert.alert(t('common.error'), t('users.kickError'));
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenRouter = () => {
    if (stats?.session?.ipAddress) {
      Linking.openURL(`http://${stats.session.ipAddress}`);
    } else {
      Alert.alert(t('common.info'), t('users.onlineOnlyRouter'));
    }
  };

  const handleSaveWifi = async () => {
    if (!wifiForm.ssid) {
      Alert.alert(t('common.error'), t('users.wifiSsidRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/genieacs/wifi', {
        deviceId: acsDevice.id,
        ssid: wifiForm.ssid,
        password: wifiForm.password
      });
      Alert.alert(t('common.success'), t('users.wifiUpdateSuccessDetail'));
      setWifiModalVisible(false);
      fetchAcsDevice();
    } catch (e: any) {
      Alert.alert(t('common.error'), t('users.wifiUpdateErrorDetail'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Using shared formatBytes utility from ../utils/format

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('users.profileTitle')}
        subtitle={customer.name || customer.username}
        role={currentUser?.role?.toUpperCase()}
        userAvatar={resolveUrl(currentUser?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('CustomerForm', { 
              customer: stats ? { ...customer, ...stats } : customer, 
              mode: 'edit' 
            })}
          >
            <Edit size={22} color="#2563eb" />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading || loadingAcs}
            onRefresh={() => {
              fetchCustomerStats();
              fetchAcsDevice();
            }}
            colors={['#2563eb']}
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {customer.avatar ? (
              <Image 
                source={{ uri: resolveUrl(customer.avatar) }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={styles.avatarText}>{(customer.name || customer.username).charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>{customer.name || customer.username}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>{t('users.id')}: {customer.customerId || customer.username}</Text>
            </View>
            {customer.address && (
              <View style={styles.addressRow}>
                <MapPin size={12} color="#94a3b8" />
                <Text style={styles.address} numberOfLines={1}>{customer.address}</Text>
              </View>
            )}
          </View>
          {stats?.billing?.status === 'unpaid' && (
            <TouchableOpacity
               style={styles.payButton}
               onPress={() => navigation.navigate('PaymentForm', { customer: { ...customer, ...stats } })}
            >
              <Banknote size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
            <View style={styles.actionIconCircle}>
              <Phone size={20} color="#fff" />
            </View>
            <Text style={styles.actionBtnText}>{t('users.call')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={handleWhatsApp}>
            <View style={styles.actionIconCircle}>
              <MessageCircle size={20} color="#fff" />
            </View>
            <Text style={styles.actionBtnText}>{t('users.whatsapp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.routerBtnMain]} onPress={handleOpenRouter}>
            <View style={styles.actionIconCircle}>
              <Globe size={20} color="#fff" />
            </View>
            <Text style={styles.actionBtnText}>{t('users.openRouter')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{t('users.connectionStatusMk')}</Text>
          </View>
          <View style={styles.statusBox}>
            {loading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <View style={{ flex: 1 }}>
                <View style={styles.statusRow}>
                  <View style={[styles.badge, stats?.session?.active ? { backgroundColor: COLORS.success + '20', borderColor: COLORS.success + '40' } : { backgroundColor: COLORS.error + '20', borderColor: COLORS.error + '40' }]}>
                    <Activity size={12} color={stats?.session?.active ? COLORS.success : COLORS.error} />
                    <Text style={[styles.badgeText, { color: stats?.session?.active ? COLORS.success : COLORS.error }]}>
                      {stats?.session?.active ? t('users.online') : t('users.offline')}
                    </Text>
                  </View>
                  {stats?.session?.active && (
                    <Text style={styles.uptimeText}>{t('users.uptime')}: {stats.session.uptime}</Text>
                  )}
                </View>

                {stats?.session?.active && (
                  <View style={styles.connectionActions}>
                    <Text style={styles.ipText}>{stats.session.ipAddress}</Text>
                    <TouchableOpacity 
                      style={styles.dropSessionBtn}
                      onPress={handleDropSession}
                    >
                      <Power size={14} color="#ef4444" />
                      <Text style={styles.dropSessionText}>{t('users.kick')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.openRouterBtn}
                      onPress={() => Linking.openURL(`http://${stats.session.ipAddress}`)}
                    >
                      <ExternalLink size={14} color="#2563eb" />
                      <Text style={styles.openRouterText}>{t('users.open')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('billing.billingStatus')}</Text>
          <View style={styles.statusBox}>
            {loading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <View style={styles.billingCardContent}>
                <View style={styles.billingMain}>
                  <View style={[styles.billingBadge, stats?.billing?.status === 'unpaid' ? styles.badgeUnpaid : styles.badgePaid]}>
                    <CreditCard size={14} color={stats?.billing?.status === 'unpaid' ? '#dc2626' : '#10b981'} />
                    <Text style={[styles.billingBadgeText, { color: stats?.billing?.status === 'unpaid' ? '#991b1b' : '#065f46' }]}>
                      {stats?.billing?.status === 'unpaid' ? t('billing.unpaidBills') : t('billing.paid')}
                    </Text>
                  </View>
                  {stats?.billing?.status === 'unpaid' && (
                    <TouchableOpacity
                      style={styles.payNowBtn}
                      onPress={() => navigation.navigate('PaymentForm', { customer: { ...customer, ...stats } })}
                    >
                      <Banknote size={16} color="#fff" />
                      <Text style={styles.payNowText}>{t('billing.recordPayment')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {stats?.billing?.status === 'unpaid' && (
                  <View style={styles.billingDetails}>
                    <View style={styles.billingDetailRow}>
                      <Text style={styles.billingDetailLabel}>{t('billing.unpaidAmount')}</Text>
                      <Text style={styles.billingDetailValue}>Rp {stats.billing.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.billingDetailRow}>
                      <Text style={styles.billingDetailLabel}>{t('billing.invoice')}</Text>
                      <Text style={styles.billingDetailValue}>{stats.billing.invoice}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
             <View style={styles.iconContainer}>
               <Mail size={18} color="#64748b" />
             </View>
             <View style={styles.infoContent}>
               <Text style={styles.infoLabel}>{t('users.emailPackage')}</Text>
               <Text style={styles.infoValue}>{customer.email || '-'} ({stats?.profileName || '-'}) • Rp {(stats?.profilePrice || 0).toLocaleString()}</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
             <View style={styles.iconContainer}>
               <Users size={18} color="#64748b" />
             </View>
             <View style={styles.infoContent}>
               <Text style={styles.infoLabel}>{t('users.salesAgent')}</Text>
               <Text style={styles.infoValue}>{stats?.agent?.fullName || stats?.agent?.username || '-'}</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
             <View style={styles.iconContainer}>
               <Terminal size={18} color="#64748b" />
             </View>
             <View style={styles.infoContent}>
               <Text style={styles.infoLabel}>{t('users.technician')}</Text>
               <Text style={styles.infoValue}>{stats?.technician?.fullName || stats?.technician?.username || '-'}</Text>
             </View>
          </View>
          {customer.coordinates && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MapPin size={18} color="#64748b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('users.gpsCoordinates')}</Text>
                  <Text style={styles.infoValue}>{customer.coordinates}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => {
                    const coords = customer.coordinates.replace(/\s/g, '');
                    const label = customer.name || customer.username;
                    const url = Platform.select({
                      ios: `maps:0,0?q=${label}@${coords}`,
                      android: `geo:0,0?q=${coords}(${label})`
                    });
                    if (url) Linking.openURL(url);
                  }}
                >
                  <Globe size={18} color="#2563eb" />
                  <Text style={styles.mapButtonText}>{t('users.open')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
           style={styles.menuItem}
           onPress={() => navigation.navigate('PaymentHistory', { username: customer.username, name: customer.name })}
        >
          <View style={styles.menuLeft}>
             <View style={[styles.menuIcon, { backgroundColor: '#f0f9ff' }]}>
                <CreditCard size={20} color="#0284c7" />
             </View>
             <Text style={styles.menuLabel}>{t('users.paymentHistory')}</Text>
           </View>
          <ChevronRight size={20} color="#cbd5e1" />
        </TouchableOpacity>

         <View style={styles.section}>
           <Text style={styles.sectionTitle}>{t('users.deviceInfoAcs')}</Text>
           {loadingAcs ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : acsDevice ? (
            <View style={styles.acsContainer}>
              <View style={styles.acsHeader}>
                <View style={styles.acsModelRow}>
                  <Router size={20} color="#f97316" />
                  <Text style={styles.acsModel}>{acsDevice.model || 'Unknown Device'}</Text>
                </View>
                <View style={[styles.badge, (Date.now() - new Date(acsDevice.lastInform).getTime()) < 300000 ? styles.badgeOnline : styles.badgeOffline]}>
                  <Text style={[styles.badgeText, { color: (Date.now() - new Date(acsDevice.lastInform).getTime()) < 300000 ? '#065f46' : '#991b1b' }]}>
                    {(Date.now() - new Date(acsDevice.lastInform).getTime()) < 300000 ? t('genieacs.acsOk') : t('genieacs.acsMissed')}
                  </Text>
                </View>
              </View>

              <View style={styles.acsMetrics}>
                <View style={styles.acsMetricItem}>
                  <View style={styles.acsMetricHeader}>
                    <Wifi size={14} color="#2563eb" />
                    <Text style={styles.acsMetricLabel}>{t('genieacs.ssid')}</Text>
                  </View>
                  <Text style={styles.acsMetricValue} numberOfLines={1}>{acsDevice.ssid || '-'}</Text>
                </View>

                <View style={styles.acsMetricItem}>
                  <View style={styles.acsMetricHeader}>
                    <Activity size={14} color={parseFloat(acsDevice.rx_power) < -25 ? '#ef4444' : '#10b981'} />
                    <Text style={styles.acsMetricLabel}>{t('genieacs.signal')}</Text>
                  </View>
                  <Text style={[styles.acsMetricValue, { color: parseFloat(acsDevice.rx_power) < -25 ? '#ef4444' : '#10b981' }]}>
                    {acsDevice.rx_power !== '-' ? `${acsDevice.rx_power} dBm` : '-'}
                  </Text>
                </View>

                <View style={styles.acsMetricItem}>
                  <View style={styles.acsMetricHeader}>
                    <Cpu size={14} color="#64748b" />
                    <Text style={styles.acsMetricLabel}>{t('genieacs.temp')}</Text>
                  </View>
                  <Text style={styles.acsMetricValue}>{acsDevice.temp !== '-' ? `${acsDevice.temp}°C` : '-'}</Text>
                </View>
              </View>

              <View style={styles.acsActions}>
                <TouchableOpacity 
                   style={styles.acsActionBtn}
                   onPress={() => setWifiModalVisible(true)}
                >
                  <Edit size={16} color="#2563eb" />
                  <Text style={styles.acsActionText}>{t('users.wifiSettingsShort')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.acsActionBtn, styles.acsRebootBtn]}
                   onPress={handleReboot}
                >
                  <Power size={16} color="#ef4444" />
                  <Text style={[styles.acsActionText, styles.acsRebootText]}>{t('users.rebootShort')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
             <View style={styles.emptyAcs}>
               <Info size={20} color="#94a3b8" />
               <Text style={styles.emptyAcsText}>{t('users.noAcsDevice')}</Text>
               <TouchableOpacity onPress={fetchAcsDevice} style={styles.refreshAcs}>
                 <RefreshCw size={14} color="#2563eb" />
                 <Text style={styles.refreshAcsText}>{t('common.refresh')}</Text>
               </TouchableOpacity>
             </View>
          )}
        </View>

         <View style={styles.usageBox}>
            <Text style={styles.usageTitle}>{t('users.usageThisMonth')}</Text>
            {loading ? (
             <ActivityIndicator color="#2563eb" />
           ) : (
             <>
                <View style={{ marginBottom: 20, alignItems: 'center' }}>
                  <Text style={styles.usageLabel}>{t('common.total')}</Text>
                  <Text style={[styles.usageValue, { fontSize: 32 }]}>
                    {formatBytes((stats?.usage?.download || 0) + (stats?.usage?.upload || 0))}
                  </Text>
                </View>
                <View style={styles.usageGrid}>
                <View style={styles.usageItem}>
                   <Text style={styles.usageLabel}>{t('users.download')}</Text>
                   <Text style={styles.usageValue}>{formatBytes(stats?.usage?.download)}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.usageItem}>
                   <Text style={styles.usageLabel}>{t('users.upload')}</Text>
                   <Text style={styles.usageValue}>{formatBytes(stats?.usage?.upload)}</Text>
                </View>
             </View>
              </>
           )}
        </View>
      </ScrollView>

      {/* WiFi Edit Modal */}
      <Modal visible={wifiModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentFixed}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('genieacs.editWifiTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('genieacs.router')}: {acsDevice?.model}</Text>
              </View>
              <TouchableOpacity onPress={() => setWifiModalVisible(false)} style={styles.modalCloseBtn}>
                <CloseIcon size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoBox}>
                <Info size={16} color="#0369a1" />
                <Text style={styles.infoText}>
                  {t('genieacs.wifiNote')}
                </Text>
              </View>

              <Text style={styles.inputLabel}>{t('genieacs.ssid')} ({t('dashboard.wifiName')})</Text>
              <TextInput
                style={styles.modalInput}
                value={wifiForm.ssid}
                onChangeText={(text) => setWifiForm({...wifiForm, ssid: text})}
                placeholder={t('genieacs.ssidPlaceholder') || 'Masukkan SSID'}
              />

              <Text style={styles.inputLabel}>{t('genieacs.newPassword')} ({t('dashboard.wifiMin8')})</Text>
              <TextInput
                style={styles.modalInput}
                value={wifiForm.password}
                onChangeText={(text) => setWifiForm({...wifiForm, password: text})}
                placeholder={t('genieacs.leaveEmpty') || 'Biarkan kosong jika tidak diubah'}
                secureTextEntry={false}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.saveButtonModal, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSaveWifi}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2563eb',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  idBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  idText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    flexShrink: 1,
  },
  payButton: {
    backgroundColor: '#10b981',
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionBtn: {
    flex: 1,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  callBtn: {
    backgroundColor: '#2563eb',
  },
  waBtn: {
    backgroundColor: '#10b981',
  },
  routerBtnMain: {
    backgroundColor: '#7c3aed',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 16,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusBox: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    minHeight: 80,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeOnline: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  badgeOffline: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uptimeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  connectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    gap: 12,
  },
  ipText: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dropSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  dropSessionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  openRouterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  openRouterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },
  billingCardContent: {
    flex: 1,
  },
  billingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  billingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  billingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeUnpaid: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  badgePaid: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  payNowText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '900',
  },
  billingDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  billingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  billingDetailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginVertical: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  acsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
  },
  acsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  acsModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  acsModel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  acsMetrics: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  acsMetricItem: {
    flex: 1,
    gap: 8,
  },
  acsMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acsMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  acsMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  acsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  acsActionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563eb',
  },
  acsRebootBtn: {
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
  },
  acsRebootText: {
    color: '#ef4444',
  },
  emptyAcs: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  emptyAcsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshAcs: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshAcsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },
  usageBox: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 24,
    marginTop: 8,
    marginBottom: 20,
  },
  usageTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  usageGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageItem: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    marginBottom: 6,
  },
  usageValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentFixed: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    marginBottom: 32,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalFooter: {
    paddingBottom: 8,
  },
  saveButtonModal: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  }
});
