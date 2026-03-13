import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { ArrowLeft, Info, Heart, Shield, Globe } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function AboutScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tentang Aplikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Buroq Manager</Text>
          <Text style={styles.appVersion}>Versi 1.0.6 (Build 7)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Misi Kami</Text>
          <View style={styles.card}>
            <Text style={styles.description}>
              Buroq Manager hadir untuk mempermudah manajemen operasional ISP dan RT/RW Net di Indonesia. 
              Fokus kami adalah pada Kecepatan, Keandalan, dan Kemudahan Penggunaan dalam mengelola infrastruktur 
              dan penagihan pelanggan secara real-time.
            </Text>
          </View>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
             <View style={[styles.featureIcon, { backgroundColor: '#e0f2fe' }]}>
                <Shield size={20} color="#2563eb" />
             </View>
             <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Aman & Privat</Text>
                <Text style={styles.featureDesc}>Data Anda dienkripsi dan hanya Anda yang memiliki kontrol penuh.</Text>
             </View>
          </View>

          <View style={styles.featureItem}>
             <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
                <Globe size={20} color="#d97706" />
             </View>
             <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Dukungan Multi-NAS</Text>
                <Text style={styles.featureDesc}>Kelola banyak router MikroTik dari satu dashboard terpusat.</Text>
             </View>
          </View>

          <View style={styles.featureItem}>
             <View style={[styles.featureIcon, { backgroundColor: '#f3e8ff' }]}>
                <Info size={20} color="#9333ea" />
             </View>
             <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Update Berkala</Text>
                <Text style={styles.featureDesc}>Kami terus menambahkan fitur baru berdasarkan masukan dari komunitas.</Text>
             </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.madeWith}>
             <Text style={styles.madeWithText}>Dibuat dengan </Text>
             <Heart size={14} color="#ef4444" fill="#ef4444" />
             <Text style={styles.madeWithText}> di Indonesia</Text>
          </View>
          <Text style={styles.copyright}>© 2026 Buroq Dev Team. All Rights Reserved.</Text>
        </View>
      </ScrollView>
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'center',
  },
  features: {
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  madeWith: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  madeWithText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  copyright: {
    fontSize: 11,
    color: '#cbd5e1',
  },
});
