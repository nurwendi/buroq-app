import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

const { width } = Dimensions.get('window');

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const CardContent = (
    <View style={styles.cardInner}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20`, borderColor: `${color}30` }]}>
          <Icon size={22} color={color} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={20} tint="dark" style={styles.blurWrapper}>
          {CardContent}
        </BlurView>
      ) : (
        <View style={styles.androidGlass}>
          {CardContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  blurWrapper: {
    width: '100%',
  },
  androidGlass: {
    backgroundColor: '#ffffff',
    width: '100%',
  },
  cardInner: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '600',
  },
});
