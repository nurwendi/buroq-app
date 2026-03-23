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
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { resolveUrl } from '../utils/url';
import GradientHeader from '../components/GradientHeader';
import { StatusBar } from 'react-native';

export default function NasManagementScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { user } = useAuth();
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
      Alert.alert(t('common.error'), t('nas.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nasname || !form.secret) {
      Alert.alert(t('common.error'), t('nas.validationError'));
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
      Alert.alert(t('common.error'), t('nas.saveError'));
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
        <Text style={styles.nasDescription} numberOfLines={1}>{item.description || t('nas.noDesc')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('nas.title')}
        subtitle={nasList.length > 0 ? `${nasList.length} ${t('nas.countSuffix') || 'Routers'}` : t('nas.subtitle')}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={styles.iconButton}>
            <Plus size={24} color="#2563eb" />
          </TouchableOpacity>
        }
      />

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
              <Text style={styles.emptyText}>{t('nas.emptyList')}</Text>
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
            <Text style={styles.modalTitle}>{form.id ? t('nas.editTitle') : t('nas.addTitle')}</Text>
            
            <ScrollView style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.ipAddress')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.nasname}
                  onChangeText={(text) => setForm({ ...form, nasname: text })}
                  placeholder={t('nas.placeholderIp') || "192.168.88.1"}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.secret')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.secret}
                  onChangeText={(text) => setForm({ ...form, secret: text })}
                  placeholder={t('nas.placeholderSecret') || "radius-secret"}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.shortname')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.shortname}
                  onChangeText={(text) => setForm({ ...form, shortname: text })}
                  placeholder={t('nas.placeholderShortname') || "mikrotik-pusat"}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  placeholder={t('nas.placeholderDesc') || "Keterangan router..."}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={saving}
                style={[styles.modalButton, styles.saveButton]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('nas.saveBtn')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  nasCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  nasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nasIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  nasInfo: {
    flex: 1,
  },
  nasName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  nasShortname: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nasActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nasFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  secretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secretText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  nasDescription: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 15,
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
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingTop: 32,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  formContent: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontWeight: '800',
    color: '#64748b',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontWeight: '900',
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
