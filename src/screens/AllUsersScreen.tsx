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
  ShieldAlert
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
          {item.prefix && (
            <View style={styles.contactItem}>
              <Shield size={14} color="#64748b" />
              <Text style={styles.contactText}>Prefix: {item.prefix}</Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.contactItem}>
              <Phone size={14} color="#64748b" />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
          {item.agentNumber && (
            <View style={styles.contactItem}>
              <User size={14} color="#64748b" />
              <Text style={styles.contactText}>Agent ID: {item.agentNumber}</Text>
            </View>
          )}
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    borderRadius: 10,
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
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
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
    width: 38,
    height: 38,
    borderRadius: 12,
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
    height: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalBody: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 90,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
