import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Switch,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { 
  ArrowLeft, 
  CreditCard, 
  Lock, 
  Save, 
  ShieldCheck,
  Zap
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function PaymentGatewaySettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    provider: 'midtrans',
    merchantId: '',
    clientKey: '',
    serverKey: '',
    isSandbox: true,
  });

  const fetchConfig = async () => {
    try {
      const response = await apiClient.get('/api/settings/payment-gateway');
      if (response.data && response.data.config) {
        setConfig(prev => ({
          ...prev,
          ...response.data.config
        }));
      }
    } catch (e) {
      console.error('Failed to fetch gateway config', e);
      Alert.alert('Error', 'Gagal memuat konfigurasi payment gateway');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/settings/payment-gateway', config);
      Alert.alert('Sukses', 'Konfigurasi berhasil disimpan');
      fetchConfig();
    } catch (e) {
      console.error('Failed to save settings', e);
      Alert.alert('Error', 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Gateway</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Zap size={24} color="#f59e0b" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Integrasi Otomatis</Text>
            <Text style={styles.infoDesc}>
              Hubungkan sistem billing dengan Midtrans untuk memproses pembayaran QRIS, Virtual Account, dan E-Wallet secara real-time.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider & Mode</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Provider</Text>
              <View style={styles.selectBox}>
                <Text style={styles.selectText}>Midtrans (Official)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Sandbox Mode</Text>
                <Text style={styles.subLabel}>Gunakan untuk testing (Tanpa uang asli)</Text>
              </View>
              <Switch 
                value={config.isSandbox}
                onValueChange={(val) => setConfig({...config, isSandbox: val})}
                trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kredensial API</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant ID</Text>
              <TextInput 
                style={styles.input}
                value={config.merchantId}
                onChangeText={(text) => setConfig({...config, merchantId: text})}
                placeholder="G12345678"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Client Key</Text>
              <View style={styles.inputWithIcon}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.flexInput}
                  value={config.clientKey}
                  onChangeText={(text) => setConfig({...config, clientKey: text})}
                  placeholder="SB-Mid-client-..."
                  autoCapitalize="none"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Server Key</Text>
              <View style={styles.inputWithIcon}>
                <ShieldCheck size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.flexInput}
                  value={config.serverKey}
                  onChangeText={(text) => setConfig({...config, serverKey: text})}
                  placeholder="SB-Mid-server-..."
                  autoCapitalize="none"
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.noteText}>
          Pastikan kredensial yang Anda masukkan sesuai dengan Dashboard Midtrans Anda. 
          Server Key digunakan untuk mengotorisasi transaksi di sisi server.
        </Text>

        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan Konfigurasi</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: Platform.OS === 'android' ? 40 : 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 24,
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  inputGroup: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: -4,
  },
  selectBox: {
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  input: {
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontWeight: '600',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginLeft: 12,
  },
  flexInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
