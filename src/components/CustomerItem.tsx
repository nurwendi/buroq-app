import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { User, ChevronRight, Circle } from 'lucide-react-native';

interface CustomerItemProps {
  customer: any;
  onPress: () => void;
}

export default function CustomerItem({ customer, onPress }: CustomerItemProps) {
  // Simple heuristic for online status (e.g., if session active)
  // In a real app, this might come from a separate 'online' field or similar
  const isOnline = customer.isOnline; 

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <User size={20} color="#64748b" />
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10b981' : '#cbd5e1' }]} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{customer.name || customer.username}</Text>
          <Text style={styles.id}>{customer.customerId || customer.username}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.addressContainer}>
           <Text style={styles.address} numberOfLines={1}>
             {isOnline ? (customer.ipAddress || 'Online') : (customer.address || 'Offline')}
           </Text>
        </View>
        <ChevronRight size={20} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  id: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '35%',
  },
  addressContainer: {
    marginRight: 10,
    flex: 1,
  },
  address: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    fontWeight: '500',
  }
});
