import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  Package, 
  Users, 
  Check,
  ChevronDown,
  BookUser,
  Compass,
  MessageSquare,
  Server,
  Info,
  Key
} from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../api/client';

export default function CustomerFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customer, mode = 'add' } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    id: customer?.id || '', // Include database ID for safe updates
    username: customer?.username || '',
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    password: '',
    profileId: customer?.profileId || '',
    agentId: customer?.agentId || '',
    technicianId: customer?.technicianId || '',
    coordinates: customer?.coordinates || '',
    comment: customer?.comment || '',
    customerId: customer?.customerId || '',
    routerIds: customer?.routerIds || [], // For Target Router selection
  });

  // Dropdown Data
  const [profiles, setProfiles] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [profilesRes, usersRes, settingsRes] = await Promise.all([
        apiClient.get('/api/profiles'),
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/settings')
      ]);
      
      setProfiles(profilesRes.data);
      setAgents(usersRes.data.filter((u: any) => u.isAgent || u.role === 'staff' || u.role === 'agent'));
      setTechnicians(usersRes.data.filter((u: any) => u.isTechnician || u.role === 'technician' || u.role === 'staff'));
      setRouters(settingsRes.data.connections || []);
      
      // If adding new, maybe select first router by default?
      if (mode === 'add' && settingsRes.data.connections?.length > 0) {
        setFormData(prev => ({ ...prev, routerIds: [settingsRes.data.connections[0].id] }));
      }
    } catch (e) {
      console.error('Failed to fetch initial data', e);
      Alert.alert('Error', 'Gagal memuat data pendukung.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username || !formData.name) {
      Alert.alert('Error', 'Username dan Nama wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      // Use POST for both add/edit as the backend API treats it as 'upsert' 
      // which includes robust logic for Radius sync, profile assignment, etc.
      await apiClient.post('/api/customers', formData);
      
      Alert.alert('Sukses', `Pelanggan berhasil ${mode === 'add' ? 'ditambahkan' : 'diperbarui'}.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const pickContact = async () => {
    // Explicit permission check
    const { status: existingStatus } = await Contacts.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Contacts.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      try {
        const contact = await Contacts.presentContactPickerAsync();
        if (contact) {
          if (contact.name) {
            setFormData(prev => ({ ...prev, name: contact.name }));
          }
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            // Format phone number: remove non-digits, handle 0 -> 62
            let phone = contact.phoneNumbers[0].number || '';
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.startsWith('0')) {
              phone = '62' + phone.slice(1);
            }
            setFormData(prev => ({ ...prev, phone: phone }));
          }
        }
      } catch (e) {
        console.log('Contact picker cancelled or failed');
      }
    } else {
      Alert.alert('Izin Ditolak', 'Aplikasi butuh izin akses kontak untuk fitur ini.');
    }
  };

  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi butuh izin lokasi untuk fitur ini.');
      return;
    }

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      setFormData(prev => ({ ...prev, coordinates: coords }));
    } catch (e) {
      Alert.alert('Error', 'Gagal mendapatkan lokasi GPS.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Memuat formulir...</Text>
      </View>
    );
  }

  const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default', rightIcon: RightIcon, onRightIconPress, editable = true }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.inputWrapperDisabled]}>
        <View style={styles.iconBox}>
          <Icon size={20} color={editable ? "#64748b" : "#94a3b8"} />
        </View>
        <TextInput 
          style={[styles.input, !editable && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor="#94a3b8"
          editable={editable}
        />
        {RightIcon && editable && (
          <TouchableOpacity 
            style={styles.rightIconBox} 
            onPress={onRightIconPress}
          >
            <RightIcon size={20} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const SectionHeader = ({ title, icon: Icon }: any) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Icon size={18} color="#2563eb" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>{mode === 'add' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            
            {/* --- SECTION 1: KREDENSIAL PPPOE --- */}
            <SectionHeader title="Kredensial PPPoE" icon={Key} />
            
            {mode === 'edit' && (
              <InputField 
                label="Customer ID (System ID)" 
                icon={Info} 
                value={formData.customerId}
                placeholder="Auto-generated"
                editable={false}
              />
            )}

            <InputField 
              label="Username / ID Client" 
              icon={User} 
              value={formData.username}
              onChangeText={(text: string) => setFormData({ ...formData, username: text })}
              placeholder="Contoh: hudi_buroq"
            />

            <InputField 
              label="Password" 
              icon={Lock} 
              value={formData.password}
              onChangeText={(text: string) => setFormData({ ...formData, password: text })}
              placeholder={mode === 'edit' ? 'Kosongkan jika tidak diubah' : 'Sandi untuk login PPPoE/WiFi'}
              secureTextEntry
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Paket / Layanan</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.iconBox}>
                  <Package size={20} color="#64748b" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                   {profiles.map((p) => (
                     <TouchableOpacity 
                        key={p.id} 
                        style={[styles.chip, formData.profileId === p.id && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, profileId: p.id })}
                     >
                        <Text style={[styles.chipText, formData.profileId === p.id && styles.chipTextActive]}>{p.name}</Text>
                        {formData.profileId === p.id && <Check size={14} color="#fff" style={{ marginLeft: 4 }} />}
                     </TouchableOpacity>
                   ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.divider} />

            {/* --- SECTION 2: TARGET ROUTER --- */}
            <SectionHeader title="Target Router" icon={Server} />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pilih Router Mikrotik</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.iconBox}>
                  <Server size={20} color="#64748b" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                   {routers.map((r) => (
                     <TouchableOpacity 
                        key={r.id} 
                        style={[styles.chip, formData.routerIds?.includes(r.id) && styles.chipActive]}
                        onPress={() => {
                          // Simple single selection for now, or multi if needed
                          setFormData({ ...formData, routerIds: [r.id] });
                        }}
                     >
                        <Text style={[styles.chipText, formData.routerIds?.includes(r.id) && styles.chipTextActive]}>{r.name}</Text>
                        {formData.routerIds?.includes(r.id) && <Check size={14} color="#fff" style={{ marginLeft: 4 }} />}
                     </TouchableOpacity>
                   ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.divider} />

            {/* --- SECTION 3: INFO PELANGGAN --- */}
            <SectionHeader title="Info Pelanggan" icon={Info} />

            <InputField 
              label="Nama Lengkap" 
              icon={User} 
              value={formData.name}
              onChangeText={(text: string) => setFormData({ ...formData, name: text })}
              placeholder="Contoh: Adi Hudi"
              rightIcon={BookUser}
              onRightIconPress={pickContact}
            />

            <InputField 
              label="Nomor WhatsApp" 
              icon={Phone} 
              value={formData.phone}
              onChangeText={(text: string) => setFormData({ ...formData, phone: text })}
              placeholder="62812..."
              keyboardType="phone-pad"
            />

            <InputField 
              label="Email (Opsional)" 
              icon={Mail} 
              value={formData.email}
              onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              placeholder="customer@example.com"
              keyboardType="email-address"
            />

            <InputField 
              label="Alamat Lengkap" 
              icon={MapPin} 
              value={formData.address}
              onChangeText={(text: string) => setFormData({ ...formData, address: text })}
              placeholder="Nama jalan, RT/RW, Dusun"
            />

            <InputField 
              label="Koordinat GPS (Lat, Long)" 
              icon={Compass} 
              value={formData.coordinates}
              onChangeText={(text: string) => setFormData({ ...formData, coordinates: text })}
              placeholder="-6.123, 106.123"
              rightIcon={MapPin}
              onRightIconPress={handleGetLocation}
            />

            <InputField 
              label="Catatan / Comment" 
              icon={MessageSquare} 
              value={formData.comment}
              onChangeText={(text: string) => setFormData({ ...formData, comment: text })}
              placeholder="Tambahkan catatan khusus..."
              multiline
            />

            <View style={styles.divider} />

            {/* --- SECTION 4: PENUGASAN --- */}
            <SectionHeader title="Penugasan" icon={Users} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pilih Sales / Agent</Text>
              <View style={styles.pickerWrapper}>
                 <View style={styles.iconBox}>
                   <Users size={20} color="#64748b" />
                 </View>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    <TouchableOpacity 
                        style={[styles.chip, !formData.agentId && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, agentId: '' })}
                     >
                        <Text style={[styles.chipText, !formData.agentId && styles.chipTextActive]}>Tanpa Agent</Text>
                    </TouchableOpacity>
                    {agents.map((a) => (
                     <TouchableOpacity 
                        key={a.id} 
                        style={[styles.chip, formData.agentId === a.id && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, agentId: a.id })}
                     >
                        <Text style={[styles.chipText, formData.agentId === a.id && styles.chipTextActive]}>{a.fullName || a.username}</Text>
                     </TouchableOpacity>
                   ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pilih Teknisi</Text>
              <View style={styles.pickerWrapper}>
                 <View style={styles.iconBox}>
                   <Users size={20} color="#64748b" />
                 </View>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    <TouchableOpacity 
                        style={[styles.chip, !formData.technicianId && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, technicianId: '' })}
                     >
                        <Text style={[styles.chipText, !formData.technicianId && styles.chipTextActive]}>Tanpa Teknisi</Text>
                    </TouchableOpacity>
                    {technicians.map((t) => (
                     <TouchableOpacity 
                        key={t.id} 
                        style={[styles.chip, formData.technicianId === t.id && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, technicianId: t.id })}
                     >
                        <Text style={[styles.chipText, formData.technicianId === t.id && styles.chipTextActive]}>{t.fullName || t.username}</Text>
                     </TouchableOpacity>
                   ))}
                </ScrollView>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Simpan Data Pelanggan</Text>
            )}
          </TouchableOpacity>
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
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 56,
  },
  inputWrapperDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  rightIconBox: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  inputDisabled: {
    color: '#94a3b8',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 64,
  },
  chipScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 24,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  }
});
