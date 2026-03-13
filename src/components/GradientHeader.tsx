import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface GradientHeaderProps {
  title?: string;
  subtitle?: string;
  role?: string;
  backgroundImage?: string;
  userAvatar?: string;
  onProfilePress?: () => void;
  children?: React.ReactNode;
}

export default function GradientHeader({ title, subtitle, role, backgroundImage, userAvatar, onProfilePress, children }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const headerHeight = 140 + insets.top;

  return (
    <View style={[styles.container, { height: headerHeight }]}>
      {backgroundImage ? (
        <ImageBackground 
          source={{ uri: backgroundImage }} 
          style={[styles.gradient, { height: headerHeight }]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(30, 58, 138, 0.8)', 'rgba(30, 58, 138, 0.5)', 'transparent']}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={['#1e3a8a', 'rgba(30, 58, 138, 0.8)', 'transparent']}
          locations={[0, 0.7, 1]}
          style={[styles.gradient, { height: headerHeight }]}
        />
      )}

      {/* Top Buttons */}
      <View style={[styles.topActions, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notification')}
        >
          <Bell size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.centerSection}>
           <TouchableOpacity onPress={onProfilePress} style={styles.avatarContainer}>
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
           
           <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>{subtitle || 'Selamat Datang,'}</Text>
              <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
              {role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                </View>
              )}
           </View>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1e3a8a', // Dark blue background for safety
    zIndex: 10,
    height: 160, // Match headerHeight (excluding insets if we want, but let's be careful)
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // Fill the container
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  topActions: {
    position: 'absolute',
    right: 20,
    zIndex: 30,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  centerSection: {
    alignItems: 'center',
    marginBottom: 0,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  textContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  roleBadge: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
});
