import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Platform,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Bell, Info, AlertTriangle, CheckCircle, Wifi, Megaphone, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

export default function NativeNotificationHandler() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<any | null>(null);
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  const hideNotification = useCallback(() => {
    translateY.value = withTiming(-200, { duration: 500 }, () => {
      opacity.value = 0;
      runOnJS(setNotification)(null);
    });
  }, [translateY, opacity]);

  const showNotification = useCallback((data: any) => {
    setNotification(data);
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(insets.top + 10, { 
      damping: 15,
      stiffness: 100
    });

    // Also trigger system notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: data.notification?.title || 'Pesan Baru',
        body: data.notification?.message || '',
        data: data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // show immediately
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
      translateY.value = withTiming(-200, { duration: 500 }, () => {
        opacity.value = 0;
        runOnJS(setNotification)(null);
      });
    }, 5000);
  }, [insets.top]);

  useEffect(() => {
    let lastId = '';
    
    const checkNotifications = async (): Promise<void> => {
      try {
        const response = await apiClient.get('/api/notifications?limit=1');
        const latest = response.data[0];
        
        if (latest && latest.id !== lastId && !latest.isRead) {
          lastId = latest.id;
          showNotification(latest);
        }
      } catch (error: any) {
        // Silent fail
      }
    };

    const interval = setInterval(() => {
      checkNotifications();
    }, 10000); // Check every 10s
    
    return () => clearInterval(interval);
  }, [showNotification]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!notification) return null;

  const getIcon = () => {
    const type = notification.notification?.type || 'info';
    switch (type) {
      case 'success': return <CheckCircle size={20} color="#10b981" />;
      case 'error': return <AlertTriangle size={20} color="#ef4444" />;
      case 'alert': return <AlertTriangle size={20} color="#f59e0b" />;
      default: return <Bell size={20} color="#3b82f6" />;
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, { top: 0 }]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.content}
        onPress={() => {
          hideNotification();
          navigation.navigate('Notification');
        }}
      >
        <View style={styles.header}>
          <View style={styles.appInfo}>
            <View style={styles.appIconContainer}>
               <Megaphone size={12} color="#ffffff" />
            </View>
            <Text style={styles.appName}>BUROQ MANAGER</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timeText}>sekarang</Text>
          </View>
          <TouchableOpacity onPress={hideNotification}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.notification?.title || 'Pesan Baru'}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {notification.notification?.message}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  dot: {
    fontSize: 10,
    color: '#94a3b8',
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  }
});
