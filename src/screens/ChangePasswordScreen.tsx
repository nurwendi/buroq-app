import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { ArrowLeft, Lock, ShieldCheck, Key } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password baru tidak cocok');
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      Alert.alert('Sukses', 'Password berhasil diubah', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error('Change password failed:', e);
      Alert.alert('Error', e.response?.data?.error || 'Gagal mengubah password. Pastikan password saat ini benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ganti Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={24} color="#2563eb" />
            </View>
            <Text style={styles.infoText}>
              Gunakan password yang kuat dan unik untuk menjaga keamanan akun Anda.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password Saat Ini</Text>
            <View style={styles.inputWrapper}>
              <Key size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form.currentPassword}
                onChangeText={(text) => setForm({ ...form, currentPassword: text })}
                secureTextEntry
                placeholder="Masukkan password lama"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form.newPassword}
                onChangeText={(text) => setForm({ ...form, newPassword: text })}
                secureTextEntry
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Konfirmasi Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form.confirmPassword}
                onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                secureTextEntry
                placeholder="Ulangi password baru"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Ganti Password Sekarang</Text>
            )}
          </TouchableOpacity>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
