import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Send, Megaphone, Users, User, ArrowLeft, Info, AlertTriangle, CheckCircle, AlertCircle, UserCog } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

type TargetType = 'all' | 'customers' | 'staff' | 'specific';
type NotificationType = 'info' | 'success' | 'alert' | 'error';

export default function BroadcastScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('customers');
  const [notifType, setNotifType] = useState<NotificationType>('info');
  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const role = user?.role?.toLowerCase() || 'admin';
  const isSuperadmin = role === 'superadmin';

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Judul tidak boleh kosong');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Pesan tidak boleh kosong');
      return;
    }

    if (targetType === 'specific' && !targetUsername.trim()) {
      Alert.alert('Error', 'Username target tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/notifications', {
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        target: targetType === 'specific' ? null : targetType,
        username: targetType === 'specific' ? targetUsername.trim() : null,
      });
      
      Alert.alert('Berhasil', 'Pengumuman telah dikirim', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to send broadcast', error);
      Alert.alert('Error', error.response?.data?.error || 'Gagal mengirim pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const getTargetOptions = () => {
    const options = [
      { id: 'all', label: 'Semua', icon: Users, desc: 'Staff & Pelanggan' },
      { id: 'customers', label: 'Pelanggan', icon: Users, desc: 'Hanya Pelanggan' },
      { id: 'staff', label: 'Staff', icon: UserCog, desc: 'Staff & Manager' },
      { id: 'specific', label: 'Spesifik', icon: User, desc: 'Target Username' },
    ];

    // Filter based on role if needed (Web version allows these 3 for Admin/Manager)
    return options;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blast Notifikasi</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Target Penerima</Text>
            <View style={styles.targetGrid}>
              {getTargetOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt.id}
                  style={[styles.targetCard, targetType === opt.id && styles.targetCardActive]}
                  onPress={() => setTargetType(opt.id as TargetType)}
                >
                  <opt.icon size={20} color={targetType === opt.id ? '#2563eb' : '#64748b'} />
                  <Text style={[styles.targetLabel, targetType === opt.id && styles.targetLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hintText}>{getTargetOptions().find(o => o.id === targetType)?.desc}</Text>
          </View>

          {targetType === 'specific' && (
            <View style={styles.section}>
              <Text style={styles.label}>Username Pelanggan</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan PPPoE Username"
                value={targetUsername}
                onChangeText={setTargetUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Tipe Notifikasi</Text>
            <View style={styles.typeGrid}>
              {[
                { id: 'info', color: '#3b82f6', icon: Info },
                { id: 'success', color: '#10b981', icon: CheckCircle },
                { id: 'alert', color: '#f59e0b', icon: AlertTriangle },
                { id: 'error', color: '#ef4444', icon: AlertCircle },
              ].map((t) => (
                <TouchableOpacity 
                  key={t.id}
                  style={[
                    styles.typeBtn, 
                    notifType === t.id && { borderColor: t.color, backgroundColor: t.color + '10' }
                  ]}
                  onPress={() => setNotifType(t.id as NotificationType)}
                >
                  <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                  <Text style={[styles.typeLabel, notifType === t.id && { color: t.color }]}>
                    {t.id.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Judul Notifikasi</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Pemeliharaan Jaringan"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Isi Pesan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tuliskan detail pengumuman Anda di sini..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendBtn, (!message.trim() || !title.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || !title.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Send size={20} color="#ffffff" />
                <Text style={styles.sendBtnText}>Kirim Sekarang</Text>
              </>
            )}
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  },
  backBtn: {
    padding: 8,
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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  targetCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  targetLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  targetLabelActive: {
    color: '#2563eb',
  },
  hintText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    marginLeft: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    minWidth: '22%',
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
  textArea: {
    height: 120,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    marginTop: 24,
    gap: 10,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    lineHeight: 16,
  }
});
