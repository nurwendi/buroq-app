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
  X as CloseIcon
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SystemUsersScreen() {
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
    address: '',
    role: 'staff',
    radiusPool: '',
    prefix: '',
    agentNumber: '',
    isAgent: false,
    agentRate: '0',
    isTechnician: false,
    technicianRate: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      // If superadmin, show everything. If admin, show everything except superadmin.
      const filtered = response.data.filter((u: any) => {
        if (currentUser?.role === 'superadmin') return true;
        if (currentUser?.role === 'admin') return u.role !== 'superadmin';
        return false;
      });
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (e) {
      console.error('Failed to fetch system users', e);
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
        (u.email && u.email.toLowerCase().includes(query))
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
        address: user.address || '',
        role: user.role || 'staff',
        radiusPool: user.radiusPool || '',
        prefix: user.prefix || '',
        agentNumber: user.agentNumber || '',
        isAgent: user.isAgent || false,
        agentRate: (user.agentRate || 0).toString(),
        isTechnician: user.isTechnician || false,
        technicianRate: (user.technicianRate || 0).toString()
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
        role: 'staff',
        radiusPool: '',
        prefix: currentUser?.prefix || '',
        agentNumber: '',
        isAgent: false,
        agentRate: '0',
        isTechnician: false,
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
      const body = {
        ...formData,
        agentRate: parseFloat(formData.agentRate) || 0,
        technicianRate: parseFloat(formData.technicianRate) || 0
      };

      if (editingUser) {
        if (!body.password) delete (body as any).password;
        await apiClient.put(`/api/admin/users/${editingUser.id}`, body);
        Alert.alert(t('common.success'), t('users.userUpdateSuccess'));
      } else {
        await apiClient.post('/api/admin/users', body);
        Alert.alert('Success', 'User berhasil ditambahkan');
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
      case 'admin': return '#2563eb';
      case 'owner': return '#2563eb';
      case 'manager': return '#8b5cf6';
      case 'staff': return '#10b981';
      case 'agent': return '#f59e0b';
      case 'technician': return '#6366f1';
      default: return '#64748b';
    }
  };


  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: getRoleColor(item.role) + '20' }]}>
          <User size={24} color={getRoleColor(item.role)} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName || item.username}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '15' }]}>
          <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
            {item.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.userFooter}>
        <View style={{ flex: 1 }}>
          {item.phone && (
            <View style={styles.contactItem}>
              <Phone size={14} color="#64748b" />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
          {item.address && (
            <View style={styles.contactItem}>
              <Text style={[styles.contactText, { marginLeft: 20 }]}>{item.address}</Text>
            </View>
          )}
          <View style={styles.roleCapabilities}>
            {item.isAgent && (
              <View style={[styles.capabilityBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={{ fontSize: 10, color: '#92400e', fontWeight: 'bold' }}>AGENT (Rp{item.agentRate || 0})</Text>
              </View>
            )}
            {item.isTechnician && (
              <View style={[styles.capabilityBadge, { backgroundColor: '#e0e7ff' }]}>
                <Text style={{ fontSize: 10, color: '#3730a3', fontWeight: 'bold' }}>TECH (Rp{item.technicianRate || 0})</Text>
              </View>
            )}
          </View>
        </View>

        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && item.role !== 'superadmin' && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
              <Edit size={18} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('systemUsers.title')}</Text>
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
            placeholder={t('systemUsers.searchPlaceholder')}
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

              <Text style={styles.label}>{t('users.phone')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>{t('users.address')}</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                multiline
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{t('users.prefix')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.prefix}
                    onChangeText={(text) => setFormData({...formData, prefix: text})}
                    placeholder="BUROQ-..."
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>{t('users.agentId')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formData.agentNumber}
                    onChangeText={(text) => setFormData({...formData, agentNumber: text})}
                  />
                </View>
              </View>

              <Text style={styles.label}>{t('users.poolRadius')}</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.radiusPool}
                placeholder="P-Radius-..."
                onChangeText={(text) => setFormData({...formData, radiusPool: text})}
              />

              <Text style={styles.label}>{t('systemUsers.systemRole')}</Text>
              <View style={styles.rolePickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Admin', 'Manager', 'Staff (Agen/Teknisi)', 'Partner', 'Viewer'].filter(r => {
                    const mappedRole = r.startsWith('Staff') ? 'staff' : r.toLowerCase();
                    if (currentUser?.role === 'superadmin') return true;
                    if (currentUser?.role === 'admin') return mappedRole !== 'admin';
                    return false;
                  }).map((r) => {
                    const mappedRole = r.startsWith('Staff') ? 'staff' : r.toLowerCase();
                    const label = mappedRole === 'staff' ? t('systemUsers.roles.staff') : t(`systemUsers.roles.${mappedRole}`);
                    return (
                      <TouchableOpacity 
                        key={r}
                         style={[styles.roleOption, (formData.role === mappedRole) && styles.roleOptionActive, { marginRight: 8 }]}
                         onPress={() => setFormData({...formData, role: mappedRole})}
                       >
                         <Text style={[styles.roleOptionText, (formData.role === mappedRole) && styles.roleOptionTextActive]}>
                           {label}
                         </Text>
                       </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Text style={styles.roleHint}>{t('systemUsers.adminHint')}</Text>
              </View>

              <View style={styles.businessRoleContainer}>
                <Text style={styles.businessRoleTitle}>{t('systemUsers.businessRole')}</Text>
                
                <TouchableOpacity 
                  style={styles.businessRoleOption} 
                  onPress={() => setFormData({...formData, isAgent: !formData.isAgent})}
                >
                  <View style={[styles.customCheckbox, formData.isAgent && styles.customCheckboxActive]}>
                    {formData.isAgent && <View style={styles.customCheckboxInner} />}
                  </View>
                  <Text style={styles.businessRoleLabel}>{t('systemUsers.asAgent')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.businessRoleOption} 
                  onPress={() => setFormData({...formData, isTechnician: !formData.isTechnician})}
                >
                  <View style={[styles.customCheckbox, formData.isTechnician && styles.customCheckboxActive]}>
                    {formData.isTechnician && <View style={styles.customCheckboxInner} />}
                  </View>
                  <Text style={styles.businessRoleLabel}>{t('systemUsers.asTechnician')}</Text>
                </TouchableOpacity>
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
                    <Text style={styles.saveButtonText}>{t('systemUsers.save')}</Text>
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
  row: {
    flexDirection: 'row',
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
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  userUsername: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  userFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contactText: {
    fontSize: 12,
    color: '#64748b',
  },
  roleCapabilities: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingLeft: 20,
  },
  capabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
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
  modalFooter: {
    marginTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveButton: {
    backgroundColor: '#2563eb',
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
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  roleOption: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  roleOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  roleOptionTextActive: {
    color: '#ffffff',
  },
  capabilitiesContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  rolePickerContainer: {
    marginBottom: 8,
  },
  roleHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  businessRoleContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  businessRoleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  businessRoleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customCheckboxActive: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  customCheckboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#2563eb',
  },
  businessRoleLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
});
