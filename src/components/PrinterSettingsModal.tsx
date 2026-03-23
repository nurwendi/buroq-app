import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { Bluetooth, X, RefreshCw, Printer as PrinterIcon, FileText } from 'lucide-react-native';
import { getAvailablePrinters, savePrinterMac, getPrinterMac, printTest } from '../utils/printer';
import * as Location from 'expo-location';
import { useLanguage } from '../context/LanguageContext';

interface PrinterSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({ visible, onClose }: PrinterSettingsModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedMac, setSelectedMac] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadSettings();
      scanDevices();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
       const mac = await getPrinterMac();
       setSelectedMac(mac);
    } catch (e) {
       console.error('Failed to load settings', e);
    }
  };

  const scanDevices = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1. Request Location Permission
      let locStatus = 'denied';
      try {
        const locResult = await Location.requestForegroundPermissionsAsync();
        locStatus = locResult.status;
      } catch (e) {
        console.error('Location permission request failed', e);
      }

      if (locStatus !== 'granted') {
        Alert.alert(
          t('common.error') || 'Error', 
          'Aplikasi memerlukan izin lokasi untuk memindai perangkat Bluetooth.'
        );
        setLoading(false);
        return;
      }

      // 2. Request Bluetooth permissions for Android 12+ (API 31+)
      if (Platform.OS === 'android') {
        const apiLevel = +Platform.Version;
        if (apiLevel >= 31) {
          try {
            const result = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]);

            if (
              result['android.permission.BLUETOOTH_SCAN'] !== PermissionsAndroid.RESULTS.GRANTED ||
              result['android.permission.BLUETOOTH_CONNECT'] !== PermissionsAndroid.RESULTS.GRANTED
            ) {
              Alert.alert(
                getTranslation('common.error', 'Error'), 
                'Izin Bluetooth diperlukan untuk memindai printer.'
              );
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Bluetooth permission request failed', e);
          }
        }
      }

      const printers = await getAvailablePrinters();
      // Use length check instead of Array.isArray for extreme safety if environment is weird
      if (printers && typeof printers === 'object' && typeof (printers as any).length === 'number') {
        setDevices(printers as any[]);
      } else {
        setDevices([]);
      }
    } catch (e) {
      console.error('Scan error', e);
      Alert.alert(getTranslation('common.error', 'Error'), 'Gagal memindai perangkat.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await printTest();
      Alert.alert('Sukses', 'Test print berhasil dikirim.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal melakukan test print.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (mac: string) => {
    try {
      await savePrinterMac(mac);
      setSelectedMac(mac);
      Alert.alert('Sukses', 'Printer berhasil disimpan.');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan pengaturan printer.');
    }
  };

  // Helper for safe translation with fallback
  function getTranslation(key: string, defaultVal: string): string {
    try {
      if (typeof t === 'function') {
        const val = t(key);
        if (val && val !== key) return val;
      }
    } catch (e) {}
    return defaultVal;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
               <Bluetooth size={20} color="#2563eb" />
               <Text style={styles.headerTitle}>
                 {getTranslation('appSettings.printerSettings', getTranslation('billing.printerSettings', 'Printer Settings'))}
               </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>
                 {getTranslation('billing.printerStatus', 'Printer Status')}
               </Text>
               <TouchableOpacity onPress={scanDevices} disabled={loading}>
                  <RefreshCw size={18} color={loading ? "#cbd5e1" : "#2563eb"} />
               </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>
                  {getTranslation('billing.scanNearbyDevices', 'Scanning...')}
                </Text>
              </View>
            ) : (devices && typeof (devices as any).length === 'number' && (devices as any).length > 0) ? (
              <FlatList 
                data={devices}
                keyExtractor={(item, index) => (item && item.inner_mac_address) || (index + "")}
                renderItem={({ item }) => {
                  if (!item) return null;
                  const isSelected = selectedMac === item.inner_mac_address;
                  return (
                    <TouchableOpacity 
                      style={[
                        styles.deviceItem, 
                        isSelected && styles.deviceItemSelected
                      ]}
                      onPress={() => item.inner_mac_address && handleSelect(item.inner_mac_address)}
                    >
                      <View style={styles.deviceIcon}>
                         <PrinterIcon size={20} color="#64748b" />
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={styles.deviceName}>{item.device_name || 'Printer'}</Text>
                         <Text style={styles.deviceMac}>{item.inner_mac_address || ''}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.activeBadge}>
                           <Text style={styles.activeText}>{getTranslation('dashboard.active', 'Active')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <View style={styles.centerBox}>
                <Text style={styles.noDataText}>
                  {getTranslation('billing.noPrinterFound', 'No printer found.')}
                </Text>
                <Text style={styles.hintText}>Pastikan Bluetooth nyala dan printer sudah terpasang (paired) di setelan sistem.</Text>
              </View>
            )}
          </View>
          
          {selectedMac && (
            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.testBtn, loading && styles.testBtnDisabled]} 
                onPress={handleTestPrint}
                disabled={loading}
              >
                 <FileText size={20} color="#fff" />
                 <Text style={styles.testBtnText}>Test Print</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '70%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  testBtn: {
    backgroundColor: '#6366f1',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  testBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  testBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  noDataText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deviceItemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  deviceMac: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
