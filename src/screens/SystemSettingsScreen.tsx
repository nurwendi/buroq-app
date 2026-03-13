import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  ArrowLeft, 
  Save, 
  Building, 
  MapPin, 
  Mail, 
  FileText, 
  Calendar, 
  Server, 
  Lock,
  ChevronRight
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';

export default function SystemSettingsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    companyContact: '',
    invoiceFooter: '',
    autoDropDate: 10,
    email: {
      host: '',
      port: '',
      user: '',
      password: '',
      secure: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/billing/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      Alert.alert('Error', 'Gagal mengambil data pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/billing/settings', settings);
      Alert.alert('Sukses', 'Pengaturan berhasil disimpan.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        <Text style={styles.headerTitle}>Pengaturan Sistem</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Save size={24} color="#2563eb" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Company Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#eff6ff' }]}>
                <Building size={20} color="#2563eb" />
              </View>
              <Text style={styles.sectionTitle}>Informasi Perusahaan</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Perusahaan</Text>
              <TextInput
                style={styles.input}
                value={settings.companyName}
                onChangeText={(text) => setSettings({ ...settings, companyName: text })}
                placeholder="Contoh: Buroq Net"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Kontak</Text>
              <TextInput
                style={styles.input}
                value={settings.companyContact}
                onChangeText={(text) => setSettings({ ...settings, companyContact: text })}
                placeholder="billing@net.id"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.companyAddress}
                onChangeText={(text) => setSettings({ ...settings, companyAddress: text })}
                placeholder="Alamat lengkap perusahan..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Billing Automation Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#fdf2f8' }]}>
                <Calendar size={20} color="#db2777" />
              </View>
              <Text style={styles.sectionTitle}>Automasi Penagihan</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tanggal Isolir Otomatis (1-31)</Text>
              <TextInput
                style={styles.input}
                value={settings.autoDropDate ? String(settings.autoDropDate) : ''}
                onChangeText={(text) => setSettings({ ...settings, autoDropDate: parseInt(text) || 10 })}
                placeholder="10"
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>Tanggal setiap bulan di mana pelanggan belum bayar akan diisolir otomatis.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catatan Faktur (Footer)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.invoiceFooter}
                onChangeText={(text) => setSettings({ ...settings, invoiceFooter: text })}
                placeholder="Terima kasih atas kepercayaannya..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* SMTP Configuration Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#fef7e6' }]}>
                <Mail size={20} color="#d97706" />
              </View>
              <Text style={styles.sectionTitle}>Konfigurasi SMTP Email</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SMTP Host</Text>
              <TextInput
                style={styles.input}
                value={settings.email?.host}
                onChangeText={(text) => setSettings({ ...settings, email: { ...settings.email, host: text } })}
                placeholder="smtp.gmail.com"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Port</Text>
                <TextInput
                  style={styles.input}
                  value={settings.email?.port ? String(settings.email.port) : ''}
                  onChangeText={(text) => setSettings({ ...settings, email: { ...settings.email, port: text } })}
                  placeholder="587"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Secure (TLS)</Text>
                <View style={styles.switchWrapper}>
                  <Switch
                    value={settings.email?.secure}
                    onValueChange={(val) => setSettings({ ...settings, email: { ...settings.email, secure: val } })}
                    trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                    thumbColor={settings.email?.secure ? '#2563eb' : '#f4f4f5'}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username / Email</Text>
              <TextInput
                style={styles.input}
                value={settings.email?.user}
                onChangeText={(text) => setSettings({ ...settings, email: { ...settings.email, user: text } })}
                placeholder="email@gmail.com"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password / App Password</Text>
              <TextInput
                style={styles.input}
                value={settings.email?.password}
                onChangeText={(text) => setSettings({ ...settings, email: { ...settings.email, password: text } })}
                placeholder={settings.email?.password === '******' ? 'Tersimpan' : 'Masukkan password baru'}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  saveButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    marginLeft: 4,
  },
  switchWrapper: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
