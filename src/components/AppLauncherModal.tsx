import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Modal } from 'react-native';
import { 
  X, 
  Home, 
  Users, 
  CreditCard, 
  Settings, 
  Activity, 
  Bell, 
  WifiOff, 
  Server, 
  Shield, 
  Database,
  Globe,
  FileText,
  ClipboardList
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Animated, { SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AppLauncherModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const role = user?.role || 'customer';

  // Similar to Web version launcher items
  const allItems = [
    { name: 'Dashboard', icon: Home, nav: 'Home', roles: ['superadmin', 'admin', 'manager', 'partner', 'viewer', 'customer', 'staff', 'technician'] },
    { name: 'Tagihan', icon: CreditCard, nav: 'BillingTab', roles: ['admin', 'manager', 'partner', 'staff', 'technician'] },
    { name: 'Laporan', icon: Activity, nav: 'FinancialReport', roles: ['superadmin', 'admin'] },
    { name: 'Pelanggan', icon: Users, nav: 'UsersTab', roles: ['admin', 'manager', 'partner', 'viewer', 'staff', 'technician'] },
    { name: 'Offline', icon: WifiOff, nav: null, roles: ['admin', 'manager', 'partner', 'viewer', 'staff', 'technician'] },
    { name: 'Semua User', icon: Globe, nav: 'AllUsers', roles: ['superadmin', 'admin'] },
    { name: 'Profile PPPoE', icon: Server, nav: 'PppoeProfiles', roles: ['admin', 'manager', 'superadmin'] },
    { name: 'Router Management', icon: Server, nav: 'NAT', roles: ['admin', 'manager', 'superadmin'] },
    { name: 'Sistem Admin', icon: Shield, nav: 'SystemUsers', roles: ['superadmin', 'admin'] },
    { name: 'Backup DB', icon: Database, nav: null, roles: ['superadmin'] },
    { name: 'Invoice', icon: FileText, nav: 'BillingTab', roles: ['superadmin'] },
    { name: 'Pengaturan', icon: Settings, nav: 'SettingsTab', roles: ['superadmin', 'admin', 'manager', 'partner', 'staff', 'technician', 'customer'] },
    { name: 'Notifikasi', icon: Bell, nav: 'Notification', roles: ['superadmin', 'admin', 'manager', 'partner', 'staff', 'technician', 'customer'] },
    { name: 'Log Sistem', icon: ClipboardList, nav: 'Logs', roles: ['superadmin', 'admin', 'manager', 'partner', 'staff', 'technician'] },
  ];

  const visibleItems = allItems.filter(item => item.roles.includes(role));

  const handleNavigate = (navTarget: string | null) => {
    onClose();
    if (navTarget) {
      navigation.navigate(navTarget);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        {visible && (
          <Animated.View 
            entering={SlideInDown.duration(400).easing(Easing.out(Easing.poly(4)))} 
            exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.poly(4)))}
            style={styles.modalContentWrapper}
          >
            <BlurView intensity={90} tint="light" style={[styles.modalContent, { paddingBottom: insets.bottom + 120 }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Aplikasi</Text>
            </View>

            <View style={styles.gridContainer}>
              {visibleItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.gridItem}
                    onPress={() => handleNavigate(item.nav)}
                  >
                    <View style={styles.iconContainer}>
                      <Icon size={32} color="#2563eb" />
                    </View>
                    <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={styles.bottomCloseButton}>
                <X size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.closeText}>Tutup</Text>
            </View>

            </BlurView>
          </Animated.View>
        )}
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Lighter backdrop for blur to show
  },
  modalContentWrapper: {
    width: '100%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Translucent base for blur
    minHeight: Dimensions.get('window').height * 0.6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 25, // Align with common dock position
    left: 0,
    right: 0,
  },
  bottomCloseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 8,
  },
  closeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: (width - 40) / 4, // 4 items per row
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glassy icon container
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  itemText: {
    fontSize: 13, // Slightly larger
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
  }
});
