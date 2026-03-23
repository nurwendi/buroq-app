import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { Lock, ShieldCheck, Key } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import GradientHeader from '../components/GradientHeader';
import { useLanguage } from '../context/LanguageContext';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert('Error', t('common.allFieldsRequired') || 'Semua field wajib diisi');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('Error', t('auth.passwordMismatch') || 'Konfirmasi password baru tidak cocok');
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert('Error', t('auth.passwordTooShort') || 'Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      Alert.alert(t('common.success') || 'Sukses', t('auth.passwordChanged') || 'Password berhasil diubah', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error('Change password failed:', e);
      Alert.alert('Error', e.response?.data?.error || t('auth.changePasswordFailed') || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GradientHeader 
        title={t('auth.changePassword') || 'Ganti Password'} 
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={24} color="#2563eb" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>{t('auth.secureAccount') || 'Amankan Akun'}</Text>
              <Text style={styles.infoText}>
                {t('auth.passwordInstructions') || 'Gunakan password yang kuat dan unik untuk menjaga keamanan akun Anda.'}
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('auth.currentPassword') || 'Password Saat Ini'}</Text>
              <View style={styles.inputWrapper}>
                <Key size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.currentPassword}
                  onChangeText={(text) => setForm({ ...form, currentPassword: text })}
                  secureTextEntry
                  placeholder={t('auth.enterCurrentPassword') || 'Masukkan password lama'}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('auth.newPassword') || 'Password Baru'}</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.newPassword}
                  onChangeText={(text) => setForm({ ...form, newPassword: text })}
                  secureTextEntry
                  placeholder={t('auth.minCharacter') || 'Minimal 6 karakter'}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('auth.confirmNewPassword') || 'Konfirmasi Password Baru'}</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.confirmPassword}
                  onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                  secureTextEntry
                  placeholder={t('auth.repeatNewPassword') || 'Ulangi password baru'}
                  placeholderTextColor="#94a3b8"
                />
              </View>
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
              <>
                <Text style={styles.saveButtonText}>{t('auth.changePasswordNow') || 'Ganti Password Sekarang'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1e40af',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#60a5fa',
    fontWeight: '600',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  formGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#f1f5f9',
    marginVertical: 24,
    marginHorizontal: -24,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
