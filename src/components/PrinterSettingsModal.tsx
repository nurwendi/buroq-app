import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Bluetooth, X, RefreshCw, Printer as PrinterIcon } from 'lucide-react-native';
import { getAvailablePrinters, savePrinterMac, getPrinterMac } from '../utils/printer';
import * as Location from 'expo-location';

interface PrinterSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({ visible, onClose }: PrinterSettingsModalProps) {
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
    const mac = await getPrinterMac();
    setSelectedMac(mac);
  };

  const scanDevices = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin lokasi untuk memindai perangkat Bluetooth.');
        setLoading(false);
        return;
      }

      const printers = await getAvailablePrinters();
      setDevices(printers || []);
    } catch (e) {
      console.error('Scan error', e);
      Alert.alert('Error', 'Gagal memindai perangkat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (mac: string) => {
    await savePrinterMac(mac);
    setSelectedMac(mac);
    Alert.alert('Sukses', 'Printer berhasil disimpan.');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
               <Bluetooth size={20} color="#2563eb" />
               <Text style={styles.headerTitle}>Pengaturan Printer</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Pilih Printer Bluetooth</Text>
               <TouchableOpacity onPress={scanDevices} disabled={loading}>
                  <RefreshCw size={18} color={loading ? "#cbd5e1" : "#2563eb"} />
               </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Memindai perangkat...</Text>
              </View>
            ) : devices.length > 0 ? (
              <FlatList 
                data={devices}
                keyExtractor={(item) => item.inner_mac_address}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.deviceItem, 
                      selectedMac === item.inner_mac_address && styles.deviceItemSelected
                    ]}
                    onPress={() => handleSelect(item.inner_mac_address)}
                  >
                    <View style={styles.deviceIcon}>
                       <PrinterIcon size={20} color="#64748b" />
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={styles.deviceName}>{item.device_name || 'Printer Tanpa Nama'}</Text>
                       <Text style={styles.deviceMac}>{item.inner_mac_address}</Text>
                    </View>
                    {selectedMac === item.inner_mac_address && (
                      <View style={styles.activeBadge}>
                         <Text style={styles.activeText}>Aktif</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <View style={styles.centerBox}>
                <Text style={styles.noDataText}>Tidak ada printer ditemukan.</Text>
                <Text style={styles.hintText}>Pastikan Bluetooth nyala dan printer sudah terpasang (paired) di setelan sistem.</Text>
              </View>
            )}
          </View>
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
    height: '60%',
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
