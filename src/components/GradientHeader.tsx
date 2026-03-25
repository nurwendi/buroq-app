import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

interface GradientHeaderProps {
  title?: string;
  subtitle?: string;
  role?: string;
  backgroundImage?: string; // Kept for compatibility but unused
  userAvatar?: string;
  onProfilePress?: () => void;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  isFullBackground?: boolean; // Kept for compatibility but unused
  children?: React.ReactNode;
}

export default function GradientHeader({ 
  title, 
  subtitle, 
  role, 
  userAvatar, 
  onProfilePress, 
  onBackPress,
  rightElement,
  children 
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const headerHeight = insets.top + 65;

  return (
    <View style={[styles.container, { height: headerHeight }]}>
      <View style={[styles.navbar, { paddingTop: insets.top }]}>
        <View style={styles.navLeft}>
            {onBackPress && (
              <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                <ArrowLeft size={22} color={COLORS.slate[800]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onProfilePress} style={[styles.compactAvatar, onBackPress && { marginLeft: 0 }]}>
              {userAvatar ? (
                 <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
              ) : (
                 <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                       {title ? title.charAt(0).toUpperCase() : 'U'}
                    </Text>
                 </View>
              )}
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
              {role && <Text style={styles.roleText}>{role}</Text>}
            </View>
        </View>

        <View style={styles.navRight}>
          {rightElement ? (
            rightElement
          ) : (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notification')}
            >
              <Bell size={20} color={COLORS.slate[800]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  navbar: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navRight: {
    flexDirection: 'row',
  },
  compactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    backgroundColor: COLORS.surface,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  titleContainer: {
    marginLeft: 14,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -0.5,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

