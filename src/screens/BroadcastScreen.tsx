import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Send, Megaphone, Users, User, Info, AlertTriangle, CheckCircle, AlertCircle, UserCog } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';
import { COLORS } from '../constants/theme';

type TargetType = 'all' | 'customers' | 'staff' | 'specific';
type NotificationType = 'info' | 'success' | 'alert' | 'error';

export default function BroadcastScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('customers');
  const [notifType, setNotifType] = useState<NotificationType>('info');
  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const role = user?.role?.toLowerCase() || 'admin';
  const isSuperadmin = role === 'superadmin';

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('broadcast.titleRequired'));
      return;
    }
    if (!message.trim()) {
      Alert.alert(t('common.error'), t('broadcast.messageRequired'));
      return;
    }

    if (targetType === 'specific' && !targetUsername.trim()) {
      Alert.alert(t('common.error'), t('broadcast.usernameRequired'));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/notifications', {
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        target: targetType === 'specific' ? null : targetType,
        username: targetType === 'specific' ? targetUsername.trim() : null,
      });
      
      Alert.alert(t('common.success'), t('broadcast.sendSuccess'), [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to send broadcast', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('broadcast.sendError'));
    } finally {
      setLoading(false);
    }
  };

  const getTargetOptions = () => {
    const options = [
      { id: 'all', label: t('broadcast.all'), icon: Users, desc: t('broadcast.allDesc') },
      { id: 'customers', label: t('broadcast.customers'), icon: Users, desc: t('broadcast.customersDesc') },
      { id: 'staff', label: t('broadcast.staff'), icon: UserCog, desc: t('broadcast.staffDesc') },
      { id: 'specific', label: t('broadcast.specific'), icon: User, desc: t('broadcast.specificDesc') },
    ];

    // Filter based on role if needed (Web version allows these 3 for Admin/Manager)
    return options;
  };

  return (
    <View style={styles.safeArea}>
      <GradientHeader 
        title={t('broadcast.title')}
        role={role.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>{t('broadcast.targetRecipient')}</Text>
            <View style={styles.targetGrid}>
              {getTargetOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt.id}
                  style={[styles.targetCard, targetType === opt.id && styles.targetCardActive]}
                  onPress={() => setTargetType(opt.id as TargetType)}
                >
                  <opt.icon size={20} color={targetType === opt.id ? COLORS.primary : COLORS.slate[400]} />
                  <Text style={[styles.targetLabel, targetType === opt.id && styles.targetLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hintText}>{getTargetOptions().find(o => o.id === targetType)?.desc}</Text>
          </View>

          {targetType === 'specific' && (
            <View style={styles.section}>
              <Text style={styles.label}>{t('broadcast.targetUsername')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('broadcast.usernamePlaceholder')}
                value={targetUsername}
                onChangeText={setTargetUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>{t('broadcast.notifType')}</Text>
            <View style={styles.typeGrid}>
              {[
                { id: 'info', color: COLORS.primary, icon: Info },
                { id: 'success', color: COLORS.success, icon: CheckCircle },
                { id: 'alert', color: COLORS.warning, icon: AlertTriangle },
                { id: 'error', color: COLORS.error, icon: AlertCircle },
              ].map((t) => (
                <TouchableOpacity 
                  key={t.id}
                  style={[
                    styles.typeBtn, 
                    notifType === t.id && { borderColor: t.color, backgroundColor: t.color + '10' }
                  ]}
                  onPress={() => setNotifType(t.id as NotificationType)}
                >
                  <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                  <Text style={[styles.typeLabel, notifType === t.id && { color: t.color }]}>
                    {t.id.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('broadcast.notifTitle')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('broadcast.notifTitlePlaceholder')}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('broadcast.messageContent')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('broadcast.messagePlaceholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendBtn, (!message.trim() || !title.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || !title.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Send size={20} color="#ffffff" />
                <Text style={styles.sendBtnText}>{t('broadcast.sendNow')}</Text>
              </>
            )}
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate[400],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  targetCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.slate[100],
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  targetCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  targetLabel: {
    fontSize: 13,
    color: COLORS.slate[500],
    fontWeight: '700',
  },
  targetLabelActive: {
    color: COLORS.primary,
  },
  hintText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginLeft: 8,
    fontWeight: '500',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    minWidth: '22%',
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    fontSize: 15,
    borderWidth: 1.2,
    borderColor: '#f1f5f9',
    color: '#0f172a',
    fontWeight: '500',
  },
  textArea: {
    height: 140,
    paddingTop: 16,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    marginTop: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  }
});
