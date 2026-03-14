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
import { Router, Search, Power, Wifi, Hourglass, ArrowLeft } from 'lucide-react-native';
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
              <Router size={20} color="#f97316" />
            </View>
            <View>
              <Text style={styles.modelName}>{item.model || t('genieacs.unknownDevice')}</Text>
              <Text style={styles.manufacturer}>{item.manufacturer}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
            <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
              {isOnline ? t('genieacs.online') : t('genieacs.offline')}
            </Text>
          </View>
        </View>

        <View style={styles.metadataGrid}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>{t('genieacs.user')}</Text>
            <Text style={styles.metadataValue}>{item.pppoe_user}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>{t('genieacs.ip')}</Text>
            <Text style={styles.metadataValue}>{item.ip}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>{t('genieacs.sn')}</Text>
            <Text style={styles.metadataValue}>{item.serial}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Wifi size={14} color="#3b82f6" />
            <Text style={styles.metricText} numberOfLines={1}>{item.ssid || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t('genieacs.signal')}</Text>
            <Text style={[styles.metricText, { color: rxColor }]}>
              {item.rx_power !== '-' ? item.rx_power + ' dBm' : '-'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t('genieacs.temp')}</Text>
            <Text style={styles.metricText}>
              {item.temp !== '-' ? item.temp + '°C' : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.wifiButton]}
            onPress={() => openEditWifi(item)}
          >
            <Wifi size={16} color="#1d4ed8" />
            <Text style={styles.wifiButtonText}>{t('users.wifiSettingsShort')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rebootButton]}
            onPress={() => handleReboot(item.id, item.serial)}
          >
            <Power size={16} color="#b91c1c" />
            <Text style={styles.rebootButtonText}>{t('users.rebootShort')}</Text>
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
          <Hourglass size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('genieacs.placeholder')}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchDevices(search)}
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
            <Text style={styles.modalTitle}>{t('genieacs.editWifiTitle')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('genieacs.sn')}: {editingDevice?.serial}{'\n'}
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
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  refreshButton: {
    padding: 8,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    padding: 10,
    backgroundColor: '#fff7ed',
    borderRadius: 10,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  manufacturer: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  onlineBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  offlineBadge: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  onlineText: {
    color: '#15803d',
  },
  offlineText: {
    color: '#64748b',
  },
  metadataGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#f1f5f9',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  wifiButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  wifiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  rebootButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  rebootButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b91c1c',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#0f172a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
