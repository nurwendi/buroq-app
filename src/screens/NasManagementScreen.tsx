import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { 
  ArrowLeft, 
  Plus, 
  Server, 
  Trash2, 
  Edit2, 
  Shield,
  Info
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';

export default function NasManagementScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [nasList, setNasList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nasname: '',
    shortname: '',
    secret: '',
    description: ''
  });

  useEffect(() => {
    fetchNas();
  }, []);

  const fetchNas = async () => {
    try {
      const response = await apiClient.get('/api/radius/nas');
      setNasList(response.data);
    } catch (error) {
      console.error('Failed to fetch NAS:', error);
      Alert.alert('Error', 'Gagal mengambil data NAS.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nasname || !form.secret) {
      Alert.alert('Error', 'IP Address dan Secret wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/radius/nas', form);
      fetchNas();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save NAS:', error);
      Alert.alert('Error', 'Gagal menyimpan NAS.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      nasname: '',
      shortname: '',
      secret: '',
      description: ''
    });
  };

  const renderNasItem = ({ item }: any) => (
    <View style={styles.nasCard}>
      <View style={styles.nasHeader}>
        <View style={styles.nasIconContainer}>
          <Server size={20} color="#2563eb" />
        </View>
        <View style={styles.nasInfo}>
          <Text style={styles.nasName}>{item.nasname}</Text>
          <Text style={styles.nasShortname}>{item.shortname || '-'}</Text>
        </View>
        <View style={styles.nasActions}>
          <TouchableOpacity onPress={() => { setForm(item); setModalVisible(true); }} style={styles.actionButton}>
            <Edit2 size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.nasFooter}>
        <View style={styles.secretBadge}>
          <Shield size={12} color="#2563eb" style={{ marginRight: 4 }} />
          <Text style={styles.secretText}>{item.secret}</Text>
        </View>
        <Text style={styles.nasDescription} numberOfLines={1}>{item.description || 'Tidak ada deskripsi'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NAS Management</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={styles.addButton}>
          <Plus size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={nasList}
          keyExtractor={(item: any) => item.id?.toString()}
          renderItem={renderNasItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Server size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Belum ada NAS terkonfigurasi</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{form.id ? 'Edit NAS' : 'Tambah NAS Baru'}</Text>
            
            <ScrollView style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NAS IP Address</Text>
                <TextInput
                  style={styles.input}
                  value={form.nasname}
                  onChangeText={(text) => setForm({ ...form, nasname: text })}
                  placeholder="192.168.88.1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Secret</Text>
                <TextInput
                  style={styles.input}
                  value={form.secret}
                  onChangeText={(text) => setForm({ ...form, secret: text })}
                  placeholder="radius-secret"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shortname (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.shortname}
                  onChangeText={(text) => setForm({ ...form, shortname: text })}
                  placeholder="mikrotik-pusat"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deskripsi</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  placeholder="Keterangan router..."
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={saving}
                style={[styles.modalButton, styles.saveButton]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan NAS</Text>
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
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  nasCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nasIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nasInfo: {
    flex: 1,
  },
  nasName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  nasShortname: {
    fontSize: 12,
    color: '#64748b',
  },
  nasActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  nasFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  secretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  secretText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  nasDescription: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94a3b8',
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
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContent: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
