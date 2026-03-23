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
  KeyboardAvoidingView,
  ScrollView,
  Clipboard,
  StatusBar
} from 'react-native';
import { 
  Server, 
  ArrowLeft, 
  Database,
  Shield,
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  X as CloseIcon,
  Wifi,
  Activity,
  AlertTriangle,
  Settings,
  Terminal,
  RefreshCw,
  Cpu,
  Layers,
  Power,
  CheckCircle,
  Copy,
  Check,
  Code
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';

export default function NATScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'mikrotik' | 'nas' | 'isolir'>('mikrotik');
  
  // Tab: Mikrotik
  const [routers, setRouters] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab: NAS
  const [nasList, setNasList] = useState<any[]>([]);

  // Tab: Isolir
  const [isolirConfig, setIsolirConfig] = useState({
    billingIp: '',
    appPort: '',
    poolName: 'DROPPOOL',
    poolRange: '10.100.1.2-10.100.254',
    gatewayIp: '10.100.1.1',
    networkCidr: '10.100.1.0/24'
  });
  const [savingIsolir, setSavingIsolir] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'mikrotik' | 'nas'>('mikrotik');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mikrotikForm, setMikrotikForm] = useState({
    name: '',
    host: '',
    port: '8728',
    user: '',
    password: ''
  });

  const [nasForm, setNasForm] = useState({
    nasname: '',
    shortname: '',
    secret: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'mikrotik') {
        const statsEndpoint = user?.role === 'superadmin' ? '/api/dashboard/stats' : '/api/admin/stats';
        
        const [statsRes, configRes] = await Promise.all([
          apiClient.get(statsEndpoint).catch(() => ({ data: { routers: [] } })),
          apiClient.get('/api/settings').catch(() => ({ data: { connections: [], activeConnectionId: null } }))
        ]);
        
        if (statsRes.data?.routers) setRouters(statsRes.data.routers);
        if (configRes.data?.connections) setConnections(configRes.data.connections);
        if (configRes.data?.activeConnectionId) setActiveConnectionId(configRes.data.activeConnectionId);
      } else if (activeTab === 'nas') {
        const res = await apiClient.get('/api/radius/nas');
        setNasList(res.data);
      } else if (activeTab === 'isolir') {
        const res = await apiClient.get('/api/billing/settings');
        if (res.data?.isolir) {
          setIsolirConfig(prev => ({ ...prev, ...res.data.isolir }));
        }
      }
    } catch (e) {
      console.error('Fetch Error:', e);
      Alert.alert(t('common.error'), t('common.fetchError') || 'Gagal mengambil data sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // --- Mikrotik Handlers ---
  const handleConnect = async (id: string) => {
    try {
      setLoading(true);
      await apiClient.post('/api/settings', { activeConnectionId: id });
      setActiveConnectionId(id);
      Alert.alert(t('common.success'), t('nat.connectActiveSuccess'));
      fetchData();
    } catch (e) {
      Alert.alert(t('common.error'), t('nat.connectActiveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddMikrotik = () => {
    setModalType('mikrotik');
    setEditingItem(null);
    setMikrotikForm({ name: '', host: '', port: '8728', user: '', password: '' });
    setModalVisible(true);
  };

  const handleOpenEditMikrotik = (router: any) => {
    const conn = connections.find(c => c.id === router.id);
    if (!conn) {
      Alert.alert(t('common.error'), t('nat.routerConfigNotFound'));
      return;
    }
    setModalType('mikrotik');
    setEditingItem(conn);
    setMikrotikForm({
      name: conn.name || '',
      host: conn.host,
      port: conn.port?.toString() || '8728',
      user: conn.user,
      password: ''
    });
    setModalVisible(true);
  };

  const handleSaveMikrotik = async () => {
    if (!mikrotikForm.host || !mikrotikForm.user || !mikrotikForm.port) {
      Alert.alert(t('common.error'), t('users.requiredFields'));
      return;
    }
    setIsSubmitting(true);
    try {
      let newConnections = [...connections];
      if (editingItem) {
        newConnections = newConnections.map(c => 
          c.id === editingItem.id ? { ...c, ...mikrotikForm, password: mikrotikForm.password === '' ? '******' : mikrotikForm.password } : c
        );
      } else {
        newConnections.push({ ...mikrotikForm, id: Date.now().toString() });
      }
      await apiClient.post('/api/settings', { connections: newConnections });
      Alert.alert(t('common.success'), t('nat.routerSaved'));
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('common.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMikrotik = (router: any) => {
    Alert.alert(t('nat.edit'), t('nat.routerDeleteConfirm').replace('{name}', router.name), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try {
          const newConnections = connections.filter(c => c.id !== router.id);
          await apiClient.post('/api/settings', { connections: newConnections });
          fetchData();
        } catch (e) { Alert.alert(t('common.error'), t('common.deleteError')); }
      }}
    ]);
  };

  // --- NAS Handlers ---
  const handleOpenAddNas = () => {
    setModalType('nas');
    setEditingItem(null);
    setNasForm({ nasname: '', shortname: '', secret: '', description: '' });
    setModalVisible(true);
  };

  const handleSaveNas = async () => {
    if (!nasForm.nasname || !nasForm.secret) {
      Alert.alert('Error', 'NAS IP and Secret are required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await apiClient.post('/api/radius/nas', { ...nasForm, id: editingItem.id });
      } else {
        await apiClient.post('/api/radius/nas', nasForm);
      }
      Alert.alert(t('common.success'), t('nat.nasSaved'));
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('common.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNas = (nas: any) => {
    Alert.alert(t('common.delete'), t('nat.nasDeleteConfirm').replace('{name}', nas.nasname), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/api/radius/nas?id=${nas.id}`);
          fetchData();
        } catch (e) { Alert.alert(t('common.error'), t('common.deleteError')); }
      }}
    ]);
  };

  // --- Isolir Handlers ---
  const generateScript = () => {
    return `/ip pool add name="${isolirConfig.poolName}" ranges=${isolirConfig.poolRange}
/ppp profile add name="DROP" local-address=${isolirConfig.gatewayIp} remote-address="${isolirConfig.poolName}" dns-server=8.8.8.8,8.8.4.4 on-up="Buroq Autoisolir"

# Firewall Rules
/ip firewall filter add chain=forward protocol=udp dst-port=53 src-address=${isolirConfig.networkCidr} action=accept comment="Buroq Autoisolir - Allow DNS ID-${isolirConfig.poolName}" place-before=0
/ip firewall filter add chain=forward src-address=${isolirConfig.networkCidr} dst-address=${isolirConfig.billingIp} action=accept comment="Buroq Autoisolir - Allow to Billing"
/ip firewall nat add chain=dstnat protocol=tcp dst-port=80 src-address=${isolirConfig.networkCidr} action=dst-nat to-addresses=${isolirConfig.billingIp} to-ports=1500 comment="Buroq Autoisolir - Redirect HTTP to Isolir (Port 1500)"
/ip firewall filter add chain=forward protocol=tcp dst-port=443 src-address=${isolirConfig.networkCidr} action=reject reject-with=icmp-network-unreachable comment="Buroq Autoisolir - Reject HTTPS Isolir"
/ip firewall filter add chain=forward src-address=${isolirConfig.networkCidr} action=drop comment="Buroq Autoisolir - Drop All Other Traffic Isolir"`;
  };

  const copyScript = () => {
    Clipboard.setString(generateScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIsolir = async () => {
    setSavingIsolir(true);
    try {
      const res = await apiClient.get('/api/billing/settings');
      const currentSettings = res.data;
      await apiClient.post('/api/billing/settings', {
        ...currentSettings,
        isolir: isolirConfig
      });
      Alert.alert(t('common.success'), t('nat.isolirSaveSuccess'));
    } catch (e) {
      Alert.alert(t('common.error'), t('common.saveError'));
    } finally {
      setSavingIsolir(false);
    }
  };

  const handleRunAutoDrop = async () => {
    Alert.alert(t('nat.isolir'), t('nat.autoIsolirCheckConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: async () => {
        setSavingIsolir(true);
        try {
          const res = await apiClient.post('/api/billing/auto-drop', { action: 'check-and-drop' });
          Alert.alert(t('common.success'), res.data.message);
        } catch (e: any) {
          Alert.alert(t('common.error'), e.response?.data?.error || t('common.error'));
        } finally {
          setSavingIsolir(false);
        }
      }}
    ]);
  };

  // --- Renderers ---
  const renderRouterItem = ({ item }: { item: any }) => {
    const isActive = activeConnectionId === item.id;
    return (
      <View style={[styles.card, isActive && styles.activeCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: item.status === 'online' ? '#dcfce7' : '#fee2e2' }]}>
            {isActive ? (
              <Power size={22} color="#10b981" />
            ) : (
              <Server size={22} color={item.status === 'online' ? '#10b981' : '#ef4444'} />
            )}
          </View>
          <View style={styles.cardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cardName}>{item.name}</Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <CheckCircle size={10} color="#059669" />
                  <Text style={styles.activeBadgeText}>{t('nat.active')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub}>{item.host}</Text>
          </View>
          <View style={styles.cardActions}>
            {!isActive && (
              <TouchableOpacity onPress={() => handleConnect(item.id)} style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}>
                <Power size={18} color="#10b981" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleOpenEditMikrotik(item)} style={styles.actionBtn}>
              <Edit2 size={18} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteMikrotik(item)} style={styles.actionBtn}>
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        {item.status === 'online' && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Cpu size={14} color="#64748b" />
              <Text style={styles.statValue}>CPU {item.cpuLoad}%</Text>
            </View>
            <View style={styles.statItem}>
              <Database size={14} color="#64748b" />
              <Text style={styles.statValue}>MEM {item.memoryTotal ? Math.round((item.memoryUsed / item.memoryTotal) * 100) : 0}%</Text>
            </View>
            <View style={styles.statItem}>
              <Shield size={14} color="#64748b" />
              <Text style={styles.statValue} numberOfLines={1}>{item.identity || 'MikroTik'}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderNasItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
          <Shield size={22} color="#2563eb" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nasname}</Text>
          <Text style={styles.cardSub}>{item.shortname || 'RADIUS Client'}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => Alert.alert('Edit', 'RADIUS edit segera hadir')} style={styles.actionBtn}>
            <Edit2 size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteNas(item)} style={styles.actionBtn}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardFooter}>
         <Text style={styles.footerText}>Secret: <Text style={styles.mono}>{item.secret}</Text></Text>
         {item.description && <Text style={styles.footerDesc}>{item.description}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('nat.title')}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'mikrotik' && styles.tabActive]} 
            onPress={() => setActiveTab('mikrotik')}
          >
            <Server size={18} color={activeTab === 'mikrotik' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'mikrotik' && styles.tabTextActive]}>{t('nat.mikrotik')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nas' && styles.tabActive]} 
            onPress={() => setActiveTab('nas')}
          >
            <Shield size={18} color={activeTab === 'nas' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'nas' && styles.tabTextActive]}>{t('nat.radius')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'isolir' && styles.tabActive]} 
            onPress={() => setActiveTab('isolir')}
          >
            <Wifi size={18} color={activeTab === 'isolir' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'isolir' && styles.tabTextActive]}>{t('nat.isolir')}</Text>
          </TouchableOpacity>
        </View>
        
        {activeTab !== 'isolir' && (
          <TouchableOpacity 
            onPress={activeTab === 'mikrotik' ? handleOpenAddMikrotik : handleOpenAddNas} 
            style={styles.floatingAddBtn}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : activeTab === 'isolir' ? (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.isolirHeader}>
             <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: 12 }} />
             <View style={styles.isolirHeaderTexts}>
                <Text style={styles.isolirTitle}>{t('nat.autoIsolirTitle')}</Text>
                <Text style={styles.isolirDesc}>{t('nat.autoIsolirDesc')}</Text>
             </View>
          </View>
          
          <TouchableOpacity style={styles.runBtn} onPress={handleRunAutoDrop}>
             <RefreshCw size={20} color="#fff" />
             <Text style={styles.runBtnText}>{t('nat.runAutoIsolir')}</Text>
          </TouchableOpacity>

          <View style={styles.formSection}>
            <View style={styles.sectionTitleRow}>
               <Settings size={20} color="#1e293b" />
               <Text style={styles.sectionTitle}>{t('nat.configParameters')}</Text>
            </View>

            <View style={styles.gridForm}>
              <View style={styles.inputCol}>
                <Text style={styles.label}>{t('nat.ipPoolName')}</Text>
                <TextInput style={styles.input} value={isolirConfig.poolName} onChangeText={t => setIsolirConfig({...isolirConfig, poolName: t})} />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.label}>{t('nat.gatewayIp')}</Text>
                <TextInput style={styles.input} value={isolirConfig.gatewayIp} onChangeText={t => setIsolirConfig({...isolirConfig, gatewayIp: t})} />
              </View>
            </View>
            
            <Text style={styles.label}>{t('nat.ipPoolRange')}</Text>
            <TextInput style={styles.input} value={isolirConfig.poolRange} onChangeText={t => setIsolirConfig({...isolirConfig, poolRange: t})} />
            
            <Text style={styles.label}>{t('nat.networkCidr')}</Text>
            <TextInput style={styles.input} value={isolirConfig.networkCidr} onChangeText={t => setIsolirConfig({...isolirConfig, networkCidr: t})} placeholder="e.g. 10.100.1.0/24" />

            <View style={styles.gridForm}>
              <View style={styles.inputCol}>
                <Text style={styles.label}>{t('nat.billingServerIp')}</Text>
                <TextInput style={styles.input} value={isolirConfig.billingIp} onChangeText={t => setIsolirConfig({...isolirConfig, billingIp: t})} />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.label}>{t('nat.appPort')}</Text>
                <TextInput style={styles.input} value={isolirConfig.appPort} onChangeText={t => setIsolirConfig({...isolirConfig, appPort: t})} keyboardType="numeric" />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveIsolir} disabled={savingIsolir}>
               {savingIsolir ? <ActivityIndicator color="#fff" /> : <Save size={20} color="#fff" />}
               <Text style={styles.saveBtnText}>{t('nat.saveSettings')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.formSection, { marginTop: 20, marginBottom: 40 }]}>
             <View style={styles.sectionTitleRow}>
                <Code size={20} color="#1e293b" />
                <Text style={styles.sectionTitle}>{t('nat.generateScript')}</Text>
             </View>
             
             <View style={styles.scriptPreviewContainer}>
                <View style={styles.scriptHeader}>
                   <Text style={styles.scriptHeaderText}>{t('nat.terminalPreview')}</Text>
                   <TouchableOpacity onPress={copyScript} style={styles.copyBtn}>
                      {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#64748b" />}
                      <Text style={[styles.copyBtnText, copied && { color: '#10b981' }]}>{copied ? t('nat.scriptCopied') : t('nat.copyScript')}</Text>
                   </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                   <Text style={styles.scriptText}>{generateScript()}</Text>
                </ScrollView>
             </View>
             <Text style={styles.scriptNote}>{t('nat.scriptNote')}</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={activeTab === 'mikrotik' ? routers : nasList}
          renderItem={activeTab === 'mikrotik' ? renderRouterItem : renderNasItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Layers size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t('nat.noDataFound')}</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? t('nat.edit') : t('nat.add')} {modalType === 'mikrotik' ? t('nat.router') : t('nat.nas')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><CloseIcon size={24} color="#64748b" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalType === 'mikrotik' ? (
                <>
                  <Text style={styles.label}>{t('nat.connectionName')}</Text>
                  <TextInput style={styles.input} value={mikrotikForm.name} onChangeText={t => setMikrotikForm({...mikrotikForm, name: t})} placeholder="Router Pusat" />
                  <Text style={styles.label}>{t('nat.ipHost')}</Text>
                  <TextInput style={styles.input} value={mikrotikForm.host} onChangeText={t => setMikrotikForm({...mikrotikForm, host: t})} placeholder="192.168.1.1" autoCapitalize="none" />
                  <Text style={styles.label}>{t('nat.apiPort')}</Text>
                  <TextInput style={styles.input} value={mikrotikForm.port} onChangeText={t => setMikrotikForm({...mikrotikForm, port: t})} keyboardType="numeric" />
                  <Text style={styles.label}>{t('users.username')}</Text>
                  <TextInput style={styles.input} value={mikrotikForm.user} onChangeText={t => setMikrotikForm({...mikrotikForm, user: t})} autoCapitalize="none" />
                  <Text style={styles.label}>{t('users.password')}</Text>
                  <TextInput style={styles.input} value={mikrotikForm.password} onChangeText={t => setMikrotikForm({...mikrotikForm, password: t})} secureTextEntry placeholder={editingItem ? t('users.passwordHint') : ""} />
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t('nat.nasIpAddress')}</Text>
                  <TextInput style={styles.input} value={nasForm.nasname} onChangeText={t => setNasForm({...nasForm, nasname: t})} placeholder="192.168.88.1" />
                  <Text style={styles.label}>{t('nat.radiusSecret')}</Text>
                  <TextInput style={styles.input} value={nasForm.secret} onChangeText={t => setNasForm({...nasForm, secret: t})} placeholder="secret" autoCapitalize="none" />
                  <Text style={styles.label}>{t('nat.shortname')}</Text>
                  <TextInput style={styles.input} value={nasForm.shortname} onChangeText={t => setNasForm({...nasForm, shortname: t})} placeholder="R-Pusat" />
                  <Text style={styles.label}>{t('nat.description')}</Text>
                  <TextInput style={[styles.input, { height: 80 }]} value={nasForm.description} onChangeText={t => setNasForm({...nasForm, description: t})} multiline />
                </>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={modalType === 'mikrotik' ? handleSaveMikrotik : handleSaveNas} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Save size={20} color="#fff" />}
                <Text style={styles.saveBtnText}>Simpan Config</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 20,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#2563eb' },
  floatingAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  scrollContent: { padding: 20 },
  card: {
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
        elevation: 2,
      },
    }),
  },
  activeCard: {
    borderColor: '#10b98120',
    backgroundColor: '#f0fdf450',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  cardSub: { fontSize: 13, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
    gap: 6,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '900', color: '#059669', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardActions: { flexDirection: 'row', gap: 8 },
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
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  cardFooter: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  footerText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#2563eb', fontWeight: '800' },
  footerDesc: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontStyle: 'italic', fontWeight: '500' },
  isolirHeader: { 
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 32, 
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
  },
  isolirHeaderTexts: { alignItems: 'center', paddingHorizontal: 24 },
  isolirTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 10, letterSpacing: -0.5 },
  isolirDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  runBtn: {
    backgroundColor: '#ef4444', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 18, 
    borderRadius: 24, 
    gap: 12, 
    marginBottom: 24, 
    elevation: 6,
    shadowColor: '#ef4444', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 12,
  },
  runBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  formSection: { 
    padding: 24, 
    backgroundColor: '#ffffff', 
    borderRadius: 32, 
    borderWidth: 1.2, 
    borderColor: '#f1f5f9',
    marginBottom: 20,
  },
  sectionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f8fafc', 
    paddingBottom: 12 
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 },
  gridForm: { flexDirection: 'row', gap: 16, marginTop: 4 },
  inputCol: { flex: 1 },
  label: { fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 4 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1.2, 
    borderColor: '#f1f5f9', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56, 
    fontSize: 15, 
    color: '#0f172a',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2563eb', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 18, 
    borderRadius: 24, 
    gap: 12, 
    marginTop: 32,
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  scriptPreviewContainer: {
    backgroundColor: '#0f172a', borderRadius: 24, marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b'
  },
  scriptHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155'
  },
  scriptHeaderText: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  copyBtnText: { fontSize: 11, fontWeight: '800', color: '#cbd5e1' },
  scriptText: { 
    padding: 24, color: '#10b981', fontSize: 13, 
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 22 
  },
  scriptNote: { fontSize: 11, color: '#94a3b8', marginTop: 12, fontStyle: 'italic', fontWeight: '500', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  modalBody: { padding: 28 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 20, fontSize: 16, color: '#94a3b8', fontWeight: '700' }
});
