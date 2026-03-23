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
  Users, 
  Search, 
  User, 
  Plus,
  Mail,
  Phone,
  ArrowLeft,
  Trash2,
  Edit,
  Save,
  X as CloseIcon,
  Shield,
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  Lock,
  Hash
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveUrl } from '../utils/url';
import { Image } from 'react-native';

export default function AllUsersScreen() {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'staff',
    radiusPool: '',
    prefix: '',
    agentNumber: '',
    agentRate: '0',
    technicianRate: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = ['admin', 'manager', 'staff', 'agent', 'technician'];

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      // No filtering for All Users
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(query)) || 
        u.username.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        radiusPool: user.radiusPool || '',
        prefix: user.prefix || '',
        agentNumber: user.agentNumber || '',
        agentRate: String(user.agentRate || 0),
        technicianRate: String(user.technicianRate || 0)
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'staff',
        radiusPool: '',
        prefix: '',
        agentNumber: '',
        agentRate: '0',
        technicianRate: '0'
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.username || (!editingUser && !formData.password)) {
      Alert.alert(t('common.error'), t('users.requiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData: any = { 
          ...formData,
          agentRate: parseFloat(formData.agentRate),
          technicianRate: parseFloat(formData.technicianRate)
        };
        if (!updateData.password) delete updateData.password;
        
        await apiClient.put(`/api/admin/users/${editingUser.id}`, updateData);
        Alert.alert(t('common.success'), t('users.userUpdateSuccess'));
      } else {
        const createData = {
          ...formData,
          agentRate: parseFloat(formData.agentRate),
          technicianRate: parseFloat(formData.technicianRate)
        };
        await apiClient.post('/api/admin/users', createData);
        Alert.alert(t('common.success'), t('users.userAddSuccess'));
      }
      setModalVisible(false);
      fetchUsers();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('users.userSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('users.deleteConfirmTitle'),
      t('users.deleteConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('users.deleteBtn'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/admin/users/${id}`);
              fetchUsers();
            } catch (e) {
              Alert.alert(t('common.error'), t('users.userDeleteError'));
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'superadmin': return '#ef4444';
      case 'admin': return '#8b5cf6';
      case 'manager': return '#2563eb';
      case 'editor': return '#0ea5e9';
      case 'staff': return '#10b981';
      case 'agent': return '#f59e0b';
      case 'technician': return '#3b82f6';
      case 'viewer': return '#64748b';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: getRoleColor(item.role) + '10' }]}>
          {item.avatar ? (
            <Image 
              source={{ uri: resolveUrl(item.avatar) }} 
              style={styles.avatarImage} 
            />
          ) : (
            <User size={24} color={getRoleColor(item.role)} />
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{item.fullName || item.username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '15' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
      </View>

      <View style={styles.cardInfoGrid}>
        <View style={styles.infoRow}>
          <Shield size={14} color="#94a3b8" />
          <Text style={styles.infoLabel}>{t('users.prefix')}:</Text>
          <Text style={styles.infoValue}>{item.prefix || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Phone size={14} color="#94a3b8" />
          <Text style={styles.infoLabel}>{t('users.phone')}:</Text>
          <Text style={styles.infoValue}>{item.phone || '-'}</Text>
        </View>
        {item.agentNumber && (
          <View style={styles.infoRow}>
            <Hash size={14} color="#94a3b8" />
            <Text style={styles.infoLabel}>Agent ID:</Text>
            <Text style={styles.infoValue}>{item.agentNumber}</Text>
          </View>
        )}
      </View>

      {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && item.role !== 'superadmin' && (
        <View style={styles.cardFooter}>
          <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
            <Edit size={16} color="#475569" />
            <Text style={styles.actionBtnText}>{t('common.edit') || 'Edit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('users.allSystemUsers')}</Text>
        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') ? (
          <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('users.searchUsersPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t('users.noUsersFound')}</Text>
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
                {editingUser ? t('users.editUserModal') : t('users.addUserModal')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseIcon size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>{t('users.username')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
                autoCapitalize="none"
              />

              <Text style={styles.label}>{editingUser ? t('users.passwordHint') : t('users.password')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry
              />

              <Text style={styles.label}>{t('users.fullName')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{t('users.phone')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>{t('users.prefix')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.prefix}
                    onChangeText={(text) => setFormData({...formData, prefix: text})}
                    placeholder="BUROQ-..."
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{t('users.agentId')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.agentNumber}
                    onChangeText={(text) => setFormData({...formData, agentNumber: text})}
                    placeholder="e.g. 1001"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>{t('users.agentRate')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.agentRate}
                    onChangeText={(text) => setFormData({...formData, agentRate: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                 <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>{t('users.technicianRate')}</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.technicianRate}
                      onChangeText={(text) => setFormData({...formData, technicianRate: text})}
                      keyboardType="numeric"
                    />
                 </View>
                 <View style={{ flex: 1, marginLeft: 8 }} />
              </View>

              <Text style={styles.label}>{t('users.poolRadius')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.radiusPool}
                placeholder="P-Radius-..."
                onChangeText={(text) => setFormData({...formData, radiusPool: text})}
              />

              <Text style={styles.label}>{t('users.role')}</Text>
              <View style={styles.roleGrid}>
                {roles.map((r) => (
                  <TouchableOpacity 
                    key={r}
                    style={[styles.roleChip, formData.role === r && styles.roleChipActive]}
                    onPress={() => setFormData({...formData, role: r})}
                  >
                    <Text style={[styles.roleChipText, formData.role === r && styles.roleChipTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
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
                    <Text style={styles.saveButtonText}>{t('users.saveChanges')}</Text>
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    maxWidth: '65%',
  },
  userUsername: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardInfoGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    width: 50,
  },
  infoValue: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 16,
    paddingTop: 16,
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  deleteBtn: {
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
    width: 40,
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
    gap: 16,
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
  },
  roleChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  roleChipTextActive: {
    color: '#ffffff',
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
