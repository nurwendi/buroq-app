import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
  Platform
} from 'react-native';
import { 
  Router, 
  Search, 
  Power, 
  Wifi, 
  Hourglass, 
  ArrowLeft,
  X as CloseIcon,
  ChevronRight,
  Info,
  Activity,
  Cpu,
  Database,
  Thermometer,
  Signal
} from 'lucide-react-native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function GenieAcsScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [wifiForm, setWifiForm] = useState({ ssid: '', password: '' });

  const fetchDevices = async (query = '') => {
    setLoading(true);
    try {
      const url = query ? `/api/genieacs/devices?search=${query}` : '/api/genieacs/devices';
      const res = await apiClient.get(url);
      setDevices(res.data || []);
    } catch (e) {
      console.error('GenieACS fetch error:', e);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices(search);
    setRefreshing(false);
  };

  const handleReboot = async (deviceId: string, serial: string) => {
    Alert.alert(
      t('common.confirm'),
      t('genieacs.rebootConfirm', { sn: serial }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.post('/api/genieacs/reboot', { deviceId });
              if (res.status === 200) {
                Alert.alert(t('common.success'), t('genieacs.rebootSuccess'));
              } else {
                Alert.alert(t('common.error'), t('genieacs.rebootError'));
              }
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const openEditWifi = (device: any) => {
    setEditingDevice(device);
    setWifiForm({ ssid: device.ssid || '', password: '' });
  };

  const handleSaveWifi = async () => {
    if (!wifiForm.ssid) {
      Alert.alert(t('common.error'), t('genieacs.ssidRequired'));
      return;
    }

    Alert.alert(
      t('common.confirm'),
      t('genieacs.wifiConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async () => {
            try {
              const res = await apiClient.post('/api/genieacs/wifi', {
                deviceId: editingDevice.id,
                ssid: wifiForm.ssid,
                password: wifiForm.password
              });

              if (res.status === 200) {
                Alert.alert(t('common.success'), t('genieacs.wifiSuccess'));
                setEditingDevice(null);
              } else {
                Alert.alert(t('common.error'), t('genieacs.wifiError'));
              }
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const renderDeviceItem = ({ item }: { item: any }) => {
    const isOnline = (Date.now() - new Date(item.lastInform).getTime()) < 300000;
    const rx = parseFloat(item.rx_power);
    const rxColor = !isNaN(rx) && rx < -25 ? '#ef4444' : '#10b981';

    return (
      <View style={styles.deviceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.modelInfo}>
            <View style={styles.iconContainer}>
              <Router size={22} color="#f97316" />
            </View>
            <View style={styles.modelTextContainer}>
              <Text style={styles.modelName} numberOfLines={1}>{item.model || t('genieacs.unknownDevice')}</Text>
              <Text style={styles.manufacturer}>{item.manufacturer}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#94a3b8' }]} />
            <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
              {isOnline ? t('genieacs.online') : t('genieacs.offline')}
            </Text>
          </View>
        </View>

        <View style={styles.metadataGrid}>
          <View style={styles.metadataItem}>
            <View style={styles.metadataLabelRow}>
               <Text style={styles.metadataLabel}>{t('genieacs.user')}</Text>
            </View>
            <Text style={styles.metadataValue}>{item.pppoe_user || '-'}</Text>
          </View>
          <View style={styles.metadataDivider} />
          <View style={styles.metadataItem}>
            <View style={styles.metadataLabelRow}>
               <Text style={styles.metadataLabel}>{t('genieacs.ip')}</Text>
            </View>
            <Text style={styles.metadataValue}>{item.ip || '-'}</Text>
          </View>
        </View>

        <View style={styles.snRow}>
           <Text style={styles.snLabel}>{t('genieacs.sn')}:</Text>
           <Text style={styles.snValue}>{item.serial}</Text>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#eff6ff' }]}>
               <Wifi size={14} color="#3b82f6" />
            </View>
            <Text style={styles.metricMainText} numberOfLines={1}>{item.ssid || '-'}</Text>
            <Text style={styles.metricSubText}>SSID</Text>
          </View>
          
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: isNaN(rx) || rx < -25 ? '#fff1f2' : '#f0fdf4' }]}>
               <Signal size={14} color={rxColor} />
            </View>
            <Text style={[styles.metricMainText, { color: rxColor }]}>
              {item.rx_power !== '-' ? item.rx_power : '-'}
            </Text>
            <Text style={styles.metricSubText}>dBm</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#fdf2f8' }]}>
               <Thermometer size={14} color="#db2777" />
            </View>
            <Text style={styles.metricMainText}>
              {item.temp !== '-' ? item.temp + '°' : '-'}
            </Text>
            <Text style={styles.metricSubText}>Temp</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.wifiButton]}
            onPress={() => openEditWifi(item)}
          >
            <Wifi size={16} color="#2563eb" />
            <Text style={styles.wifiButtonText}>{t('users.wifiSettingsShort')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rebootButton]}
            onPress={() => handleReboot(item.id, item.serial)}
          >
            <Power size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('genieacs.title')}</Text>
        <TouchableOpacity onPress={() => fetchDevices(search)} style={styles.refreshButton}>
          <Hourglass size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('genieacs.placeholder')}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchDevices(search)}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Router size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t('genieacs.noDevices')}</Text>
            </View>
          }
        />
      )}

      {/* Edit WiFi Modal */}
      <Modal
        visible={!!editingDevice}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingDevice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('genieacs.editWifiTitle')}</Text>
              <TouchableOpacity onPress={() => setEditingDevice(null)}>
                <CloseIcon size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.snBadge}>
              <Text style={styles.snBadgeText}>{t('genieacs.sn')}: {editingDevice?.serial}</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              {t('genieacs.wifiNote')}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('genieacs.ssidName')}</Text>
              <TextInput
                style={styles.input}
                value={wifiForm.ssid}
                onChangeText={(text) => setWifiForm({ ...wifiForm, ssid: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('genieacs.newPassword')}</Text>
              <TextInput
                style={styles.input}
                value={wifiForm.password}
                onChangeText={(text) => setWifiForm({ ...wifiForm, password: text })}
                placeholder={t('genieacs.leaveEmpty')}
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setEditingDevice(null)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveWifi}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelTextContainer: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  manufacturer: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  onlineBadge: {
    backgroundColor: '#f0fdf4',
  },
  offlineBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  onlineText: {
    color: '#15803d',
  },
  offlineText: {
    color: '#64748b',
  },
  metadataGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metadataLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metadataValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  metadataDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  snRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  snLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  snValue: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricSubText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  wifiButton: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  wifiButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  rebootButton: {
    width: 48,
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  snBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  snBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 32,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  saveButton: {
    flex: 2,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#2563eb',
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
