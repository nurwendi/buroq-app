import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { 
  Gauge, 
  Search, 
  Plus,
  Trash2,
  Edit,
  Save,
  X as CloseIcon,
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  MapPin
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PppoeProfilesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '0',
    speedUp: '1024',
    speedDown: '2048',
    localAddress: '',
    remoteAddress: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [profilesRes, poolsRes] = await Promise.all([
        apiClient.get('/api/pppoe/profiles'),
        apiClient.get('/api/ip/pools')
      ]);

      // Parse Mikrotik style rate-limit
      const parsed = profilesRes.data.map((p: any) => {
        let down = 0, up = 0;
        if (p['rate-limit']) {
          const parts = p['rate-limit'].split('/');
          if (parts.length >= 1) up = parseSpeed(parts[0]);
          if (parts.length >= 2) down = parseSpeed(parts[1]);
        }
        return {
          ...p,
          speedUp: up.toString(),
          speedDown: down.toString(),
          localAddress: p['local-address'] || '',
          remoteAddress: p['remote-address'] || ''
        };
      });

      setProfiles(parsed);
      setFilteredProfiles(parsed);
      setPools(poolsRes.data || []);
    } catch (e) {
      console.error('Failed to fetch PPPoE profiles', e);
      Alert.alert('Error', 'Gagal mengambil data profile.');
    } finally {
      setLoading(false);
    }
  };

  const parseSpeed = (str: string) => {
    if (!str) return 0;
    str = str.toLowerCase();
    if (str.endsWith('m')) return parseFloat(str) * 1024;
    if (str.endsWith('k')) return parseFloat(str);
    return parseFloat(str);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const query = searchTerm.toLowerCase();
    const filtered = profiles.filter(p => 
      p.name.toLowerCase().includes(query)
    );
    setFilteredProfiles(filtered);
  }, [searchTerm, profiles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleOpenModal = (profile: any = null) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        name: profile.name,
        price: (profile.price || 0).toString(),
        speedUp: profile.speedUp,
        speedDown: profile.speedDown,
        localAddress: profile.localAddress,
        remoteAddress: profile.remoteAddress,
      });
    } else {
      setEditingProfile(null);
      setFormData({
        name: '',
        price: '0',
        speedUp: '1024',
        speedDown: '2048',
        localAddress: '',
        remoteAddress: '',
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Nama profile wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const rateLimit = `${formData.speedUp}k/${formData.speedDown}k`;
      const body: any = {
        name: formData.name.replace(/\s+/g, '_'),
        price: parseInt(formData.price) || 0,
        rateLimit: rateLimit,
        localAddress: formData.localAddress,
        remoteAddress: formData.remoteAddress,
        comment: `price:${formData.price}`
      };

      if (editingProfile) {
        body.id = editingProfile['.id'];
        await apiClient.patch('/api/pppoe/profiles', body);
        Alert.alert('Success', 'Profile berhasil diperbarui');
      } else {
        await apiClient.post('/api/pppoe/profiles', body);
        Alert.alert('Success', 'Profile berhasil ditambahkan');
      }
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Gagal menyimpan profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (profile: any) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Hapus profile ${profile.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/api/pppoe/profiles', { 
                params: { 
                  id: profile['.id'],
                  name: profile.name 
                } 
              });
              fetchData();
            } catch (e) {
              Alert.alert('Error', 'Gagal menghapus profile');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Gauge size={24} color="#8b5cf6" />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.profileName}>{item.name}</Text>
          <Text style={styles.priceText}>
            Rp {parseInt(item.price || 0).toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
            <Edit size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.speedRow}>
          <View style={styles.speedItem}>
            <ArrowDownCircle size={16} color="#10b981" />
            <Text style={styles.speedText}>{item.speedDown} Kbps</Text>
          </View>
          <View style={styles.speedItem}>
            <ArrowUpCircle size={16} color="#3b82f6" />
            <Text style={styles.speedText}>{item.speedUp} Kbps</Text>
          </View>
        </View>
        
        <View style={styles.poolRow}>
          <View style={styles.poolItem}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.poolText}>Local: {item.localAddress || '-'}</Text>
          </View>
          <View style={styles.poolItem}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.poolText}>Remote: {item.remoteAddress || '-'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>PPPoE Profiles</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari profile..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          renderItem={renderItem}
          keyExtractor={(item) => item['.id'] || item.name}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Gauge size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Tidak ada profile ditemukan</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProfile ? 'Edit Profile' : 'Tambah Profile'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseIcon size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nama Profile</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text.replace(/\s+/g, '_')})}
                placeholder="Contoh: Paket_5Mbps"
              />

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>Local Address (Gateway)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.localAddress}
                    onChangeText={(text) => setFormData({...formData, localAddress: text})}
                    placeholder="Pool/IP"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>Remote Address (Client)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.remoteAddress}
                    onChangeText={(text) => setFormData({...formData, remoteAddress: text})}
                    placeholder="Pool/IP"
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>Download (Kbps)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.speedDown}
                    onChangeText={(text) => setFormData({...formData, speedDown: text})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>Upload (Kbps)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.speedUp}
                    onChangeText={(text) => setFormData({...formData, speedUp: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Harga (IDR)</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.price}
                onChangeText={(text) => setFormData({...formData, price: text})}
                keyboardType="numeric"
              />
              
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Simpan Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  priceText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  poolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  poolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  poolText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalBody: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#1e293b',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },
  modalFooter: {
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
