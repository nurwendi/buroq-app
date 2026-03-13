import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import { User, Shield, LogOut, ChevronRight, Phone, Mail, MapPin } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // AuthContext should handle redirection to Login
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {user?.photo || user?.avatar || user?.profilePicture ? (
              <Image 
                source={{ uri: resolveUrl(user?.photo || user?.avatar || user?.profilePicture) }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#ffffff" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.fullName || user?.username}</Text>
          <View style={styles.roleBadge}>
            <Shield size={14} color="#2563eb" />
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{user?.username || '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Phone size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Nomor Telepon</Text>
                <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Mail size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('SettingsTab')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <User size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuLabel}>Ubah Profil</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Keluar / Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Buroq Manager v1.0.6 (Build 7)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#eff6ff',
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: '#94a3b8',
  }
});
