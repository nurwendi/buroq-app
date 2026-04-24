import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { ArrowLeft, Globe, Save, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../api/config';
import { updateApiBaseUrl } from '../api/client';

export default function ServerSettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(CONFIG.SERVER_URL_KEY);
      setBaseUrl(savedUrl || CONFIG.API_BASE_URL);
    } catch (e) {
      console.error('Failed to load server settings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!baseUrl.trim()) {
      Alert.alert('Error', 'URL Server tidak boleh kosong');
      return;
    }

    if (!baseUrl.startsWith('http')) {
      Alert.alert('Error', 'URL harus diawali dengan http:// atau https://');
      return;
    }

    setSaving(true);
    try {
      // 1. Save to AsyncStorage
      await AsyncStorage.setItem(CONFIG.SERVER_URL_KEY, baseUrl.trim());
      
      // 2. Update global apiClient
      updateApiBaseUrl(baseUrl.trim());
      
      Alert.alert('Sukses', 'Pengaturan server telah diperbarui. Aplikasi akan menggunakan URL baru untuk permintaan selanjutnya.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error('Failed to save server settings', e);
      Alert.alert('Error', 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset ke Default',
      'Apakah Anda ingin mengembalikan URL server ke nilai bawaan?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Reset', 
          onPress: () => setBaseUrl(CONFIG.API_BASE_URL) 
        }
      ]
    );
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
        <Text style={styles.headerTitle}>Pengaturan Server</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <RefreshCw size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Globe size={24} color="#2563eb" />
          </View>
          <Text style={styles.infoText}>
            Ubah URL di bawah ini jika Anda ingin menghubungkan aplikasi ke server backend yang berbeda (misalnya server lokal atau staging).
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://api.example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Pastikan URL menyertakan protokol (http/https) dan tanpa garis miring (/) di akhir.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Save size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
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
  resetButton: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
