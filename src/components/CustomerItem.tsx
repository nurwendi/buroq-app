import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { User, ChevronRight } from 'lucide-react-native';
import { resolveUrl } from '../utils/url';

interface CustomerItemProps {
  customer: any;
  onPress: () => void;
}

export default function CustomerItem({ customer, onPress }: CustomerItemProps) {
  const isOnline = customer.isOnline; 

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {customer.avatar ? (
              <Image 
                source={{ uri: resolveUrl(customer.avatar) }} 
                style={styles.avatarImage} 
              />
            ) : (
              <User size={24} color="#64748b" />
            )}
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10b981' : '#cbd5e1' }]} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{customer.name || customer.username}</Text>
          <View style={styles.idContainer}>
             <Text style={styles.idLabel}>ID: </Text>
             <Text style={styles.id}>{customer.customerId || customer.username}</Text>
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.statusBadgeContainer}>
           <Text style={[styles.statusText, { color: isOnline ? '#059669' : '#64748b' }]}>
             {isOnline ? (customer.ipAddress || 'Online') : 'Offline'}
           </Text>
        </View>
        <View style={styles.arrowIcon}>
          <ChevronRight size={18} color="#94a3b8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  id: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '800',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
