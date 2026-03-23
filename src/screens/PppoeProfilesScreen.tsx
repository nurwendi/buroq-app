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
  Hash,
  MapPin,
  ChevronRight,
  PlusCircle,
  AlertCircle
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function PppoeProfilesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
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
      Alert.alert(t('common.error'), t('pppoe.fetchError'));
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
      Alert.alert(t('common.error'), t('pppoe.nameRequired'));
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
        Alert.alert(t('common.success'), t('pppoe.profileUpdateSuccess'));
      } else {
        await apiClient.post('/api/pppoe/profiles', body);
        Alert.alert(t('common.success'), t('pppoe.profileAddSuccess'));
      }
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('pppoe.profileSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (profile: any) => {
    Alert.alert(
      t('pppoe.deleteConfirmTitle'),
      t('pppoe.deleteConfirmMsg').replace('{name}', profile.name),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
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
              Alert.alert(t('common.error'), t('pppoe.deleteError'));
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
          <Gauge size={22} color="#2563eb" />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.profileName}>{item.name}</Text>
          <Text style={styles.priceText}>
            Rp {parseInt(item.price || 0).toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
            <Edit size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionBtn, styles.deleteBtn]}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.speedSection}>
          <View style={styles.speedItem}>
            <View style={[styles.miniIcon, { backgroundColor: '#f0fdf4' }]}>
               <ArrowDownCircle size={14} color="#10b981" />
            </View>
            <View>
               <Text style={styles.speedLabel}>Download</Text>
               <Text style={styles.speedValue}>{item.speedDown} Kbps</Text>
            </View>
          </View>
          <View style={styles.speedDivider} />
          <View style={styles.speedItem}>
            <View style={[styles.miniIcon, { backgroundColor: '#eff6ff' }]}>
               <ArrowUpCircle size={14} color="#3b82f6" />
            </View>
            <View>
               <Text style={styles.speedLabel}>Upload</Text>
               <Text style={styles.speedValue}>{item.speedUp} Kbps</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.poolSection}>
          <View style={styles.poolEntry}>
            <MapPin size={12} color="#94a3b8" />
            <Text style={styles.poolLabel}>Local:</Text>
            <Text style={styles.poolValue}>{item.localAddress || '-'}</Text>
          </View>
          <View style={styles.poolEntry}>
            <MapPin size={12} color="#94a3b8" />
            <Text style={styles.poolLabel}>Remote:</Text>
            <Text style={styles.poolValue}>{item.remoteAddress || '-'}</Text>
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
        <Text style={styles.title}>{t('pppoe.title')}</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('pppoe.searchPlaceholder')}
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
              <Text style={styles.emptyText}>{t('pppoe.noProfiles')}</Text>
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
                {editingProfile ? t('pppoe.editProfileModal') || 'Edit Profile' : t('pppoe.addProfileModal') || 'Tambah Profile'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseIcon size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>{t('pppoe.name')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text.replace(/\s+/g, '_')})}
                placeholder="Contoh: Paket_5Mbps"
              />

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>{t('pppoe.localAddress')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.localAddress}
                    onChangeText={(text) => setFormData({...formData, localAddress: text})}
                    placeholder="Pool/IP"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>{t('pppoe.remoteAddress')}</Text>
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
                  <Text style={styles.label}>{t('pppoe.download')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.speedDown}
                    onChangeText={(text) => setFormData({...formData, speedDown: text})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>{t('pppoe.upload')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.speedUp}
                    onChangeText={(text) => setFormData({...formData, speedUp: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>{t('pppoe.price')}</Text>
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
                    <Text style={styles.saveButtonText}>{t('pppoe.saveBtn')}</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  priceText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteBtn: {
     backgroundColor: '#fff1f2',
     borderColor: '#ffe4e6',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
  },
  speedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  speedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  speedValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '700',
  },
  speedDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  poolSection: {
    gap: 8,
  },
  poolEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  poolLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    width: 50,
  },
  poolValue: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  modalBody: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 20,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  modalFooter: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  }
});
