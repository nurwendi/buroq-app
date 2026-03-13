import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

const { width } = Dimensions.get('window');

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={24} color={color} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16, // Synced with web (rounded-2xl)
    padding: 16,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e2e8f0',
    borderRightColor: '#e2e8f0',
    borderBottomColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
});
