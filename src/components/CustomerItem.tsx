import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { User, ChevronRight, Clock, Shield, Globe, HardDrive, Banknote, HelpCircle } from 'lucide-react-native';
import { resolveUrl } from '../utils/url';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { formatBytes } from '../utils/format';

interface CustomerItemProps {
  customer: any;
  onPress: () => void;
}

export default function CustomerItem({ customer, onPress }: CustomerItemProps) {
  const { t } = useLanguage();
  const isOnline = customer.isOnline; 
  const hasDifferentUsername = customer.name && customer.username && customer.name.toLowerCase() !== customer.username.toLowerCase();

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        customer.isIsolir && styles.isolirContainer
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {customer.avatar ? (
                <Image 
                  source={{ uri: resolveUrl(customer.avatar) }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <User size={24} color={COLORS.slate[400]} />
              )}
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? COLORS.success : COLORS.slate[300] }]} />
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
               <Text style={styles.name} numberOfLines={1}>{customer.name || customer.username}</Text>
               {customer.isIsolir && (
                 <View style={styles.isolirBadge}>
                   <Text style={styles.isolirBadgeText}>ISOLIR</Text>
                 </View>
               )}
            </View>
            
            {hasDifferentUsername && (
              <Text style={styles.username} numberOfLines={1}>@{customer.username}</Text>
            )}

            <View style={styles.detailsRow}>
               <View style={styles.profileBadge}>
                 <Shield size={10} color={COLORS.primary} style={{ marginRight: 4 }} />
                 <Text style={styles.profileText}>{customer.profileName || '-'}</Text>
               </View>
               <View style={styles.idBadge}>
                 <Text style={styles.idText}>ID: {customer.customerId || '-'}</Text>
               </View>
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.arrowIcon}>
            <ChevronRight size={18} color={COLORS.slate[400]} />
          </View>
        </View>
      </View>

      {/* Progress / Usage / Billing Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('users.totalUsage') || 'Total Usage'}</Text>
          <Text style={styles.statValue}>
            {customer.usage ? formatBytes((customer.usage.tx || 0) + (customer.usage.rx || 0)) : '-'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('financial.unpaid') || 'Tagihan'}</Text>
          <Text style={[styles.statValue, (customer.totalUnpaid > 0) ? { color: COLORS.error } : { color: COLORS.success }]}>
            {(customer.totalUnpaid > 0) ? `Rp ${customer.totalUnpaid.toLocaleString()}` : (t('dashboard.paid') || 'Lunas')}
          </Text>
        </View>
        {(customer.agentName || customer.technicianName) && (
          <View style={[styles.statItem, { flex: 1.5 }]}>
            <Text style={styles.statLabel}>{t('users.staff') || 'Staf / Agen'}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {customer.agentName || customer.technicianName || '-'}
            </Text>
          </View>
        )}
      </View>

      {/* Online Status Bar */}
      {isOnline && (
        <View style={styles.statusFooter}>
          <View style={styles.statusItem}>
            <Globe size={12} color={COLORS.success} style={{ marginRight: 4 }} />
            <Text style={styles.statusFooterText}>{customer.ipAddress || 'Connected'}</Text>
          </View>
          {customer.uptime && (
            <View style={styles.statusItem}>
              <Clock size={12} color={COLORS.slate[400]} style={{ marginRight: 4 }} />
              <Text style={styles.statusFooterText}>{customer.uptime}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  isolirContainer: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.slate[50],
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate[900],
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate[400],
    marginBottom: 6,
  },
  isolirBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 8,
  },
  isolirBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.error,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  profileText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  idBadge: {
    backgroundColor: COLORS.slate[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.slate[200],
  },
  idText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate[500],
  },
  right: {
    paddingLeft: 8,
  },
  arrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.slate[50],
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[100],
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate[600],
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate[700],
  }
});

