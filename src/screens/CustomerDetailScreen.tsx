import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Linking,
  Alert,
  Platform,
  Modal,
  TextInput
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
  Users
} from 'lucide-react-native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerDetailScreen({ route, navigation }: any) {
  const { customer } = route.params;
  const { t } = useLanguage();
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

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('users.profileTitle')}</Text>
        <TouchableOpacity
           style={styles.editButton}
           onPress={() => navigation.navigate('CustomerForm', { 
             customer: stats ? { ...customer, ...stats } : customer, 
             mode: 'edit' 
           })}
        >
          <Edit size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(customer.name || customer.username).charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>{customer.name || customer.username}</Text>
            <Text style={styles.customerId}>{t('users.id')}: {customer.customerId || customer.username}</Text>
            {customer.address && (
              <View style={styles.addressRow}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.address}>{customer.address}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
             style={styles.payButton}
             onPress={() => navigation.navigate('PaymentForm', { customer: stats })}
          >
            <CreditCard size={20} color="#fff" />
            <Text style={styles.payButtonText}>{t('sidebar.pay')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
            <Phone size={20} color="#fff" />
            <Text style={styles.actionBtnText}>{t('users.call')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={handleWhatsApp}>
             <MessageCircle size={20} color="#fff" />
             <Text style={styles.actionBtnText}>{t('users.whatsapp')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('users.connectionStatusMk')}</Text>
          <View style={styles.statusBox}>
            {loading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <View style={styles.statusRow}>
                 <View style={[styles.badge, stats?.session?.active ? styles.badgeOnline : styles.badgeOffline]}>
                    <Activity size={14} color={stats?.session?.active ? '#10b981' : '#ef4444'} />
                    <Text style={[styles.badgeText, { color: stats?.session?.active ? '#065f46' : '#991b1b' }]}>
                      {stats?.session?.active ? t('users.online') : t('users.offline')}
                    </Text>
                 </View>
                 {stats?.session?.active && (
                   <Text style={styles.uptimeText}>{t('users.uptime')}: {stats.session.uptime}</Text>
                 )}
                {stats?.session?.active && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
             <Mail size={20} color="#64748b" />
             <View style={styles.infoContent}>
               <Text style={styles.infoLabel}>{t('users.emailPackage')}</Text>
               <Text style={styles.infoValue}>{customer.email || '-'} ({stats?.profile || '-'})</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
             <Users size={20} color="#64748b" />
             <View style={styles.infoContent}>
               <Text style={styles.infoLabel}>{t('users.salesAgent')}</Text>
               <Text style={styles.infoValue}>{stats?.agent?.fullName || stats?.agent?.username || '-'}</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
             <Terminal size={20} color="#64748b" />
             <View style={styles.infoContent}>
               <Text style={styles.infoLabel}>{t('users.technician')}</Text>
               <Text style={styles.infoValue}>{stats?.technician?.fullName || stats?.technician?.username || '-'}</Text>
             </View>
          </View>
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
                  <Wifi size={16} color="#2563eb" />
                  <View style={styles.acsMetricContent}>
                    <Text style={styles.acsMetricLabel}>{t('genieacs.ssid')}</Text>
                    <Text style={styles.acsMetricValue} numberOfLines={1}>{acsDevice.ssid || '-'}</Text>
                  </View>
                </View>

                <View style={styles.acsMetricItem}>
                  <Activity size={16} color={parseFloat(acsDevice.rx_power) < -25 ? '#ef4444' : '#10b981'} />
                  <View style={styles.acsMetricContent}>
                    <Text style={styles.acsMetricLabel}>{t('genieacs.signal')}</Text>
                    <Text style={[styles.acsMetricValue, { color: parseFloat(acsDevice.rx_power) < -25 ? '#ef4444' : '#10b981' }]}>
                      {acsDevice.rx_power !== '-' ? `${acsDevice.rx_power} dBm` : '-'}
                    </Text>
                  </View>
                </View>

                <View style={styles.acsMetricItem}>
                  <Cpu size={16} color="#64748b" />
                  <View style={styles.acsMetricContent}>
                    <Text style={styles.acsMetricLabel}>{t('genieacs.temp')}</Text>
                    <Text style={styles.acsMetricValue}>{acsDevice.temp !== '-' ? `${acsDevice.temp}°C` : '-'}</Text>
                  </View>
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ebf5ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  address: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '800',
    color: '#0f172a',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  customerId: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  callBtn: {
    backgroundColor: '#2563eb',
  },
  waBtn: {
    backgroundColor: '#10b981',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  statusBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    minHeight: 64,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 10,
    gap: 6,
  },
  badgeOnline: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeOffline: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  uptimeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  ipText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  openRouterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ccfbf1', // teal-100
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4', // teal-200
  },
  openRouterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e', // teal-700
  },
  dropSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dropSessionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991b1b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  usageBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  usageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  usageGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  verticalDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#f1f5f9',
  },
  acsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  acsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  acsModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acsModel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  acsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  acsMetricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 12,
  },
  acsMetricContent: {
    flex: 1,
  },
  acsMetricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  acsMetricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  acsActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  acsActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  acsRebootBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  acsRebootText: {
    color: '#ef4444',
  },
  emptyAcs: {
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  emptyAcsText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  refreshAcs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshAcsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentFixed: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  saveButtonModal: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  }
});
