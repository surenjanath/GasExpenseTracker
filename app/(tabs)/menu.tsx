import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/lib/auth';

export default function MenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileImage = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile image:', error);
        return;
      }

      if (data?.avatar_url) {
        setProfileImage(data.avatar_url);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error in fetchProfileImage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect instead of useEffect with router.addListener
  useFocusEffect(
    React.useCallback(() => {
      fetchProfileImage();
    }, [user?.id])
  );

  const menuItems = [
    { icon: 'grid', title: 'Overview', route: '/' },
    { icon: 'car-outline', title: 'Vehicles', route: '/vehicles' },
    { icon: 'car-outline', title: 'Gas Entries', route: '/gas-entries', comingSoon: true },
    { icon: 'analytics-outline', title: 'Analytics', route: '/analytics' },
    { icon: 'calendar-outline', title: 'History', route: '/history', comingSoon: true },
    { icon: 'location-outline', title: 'Stations', route: '/stations', comingSoon: true },
    { icon: 'calculator-outline', title: 'MPG Calc', route: '/calculator', comingSoon: true },
    { icon: 'settings-outline', title: 'Settings', route: '/settings' },
    { icon: 'help-circle-outline', title: 'Help', route: '/help', comingSoon: true },
    { icon: 'information-circle-outline', title: 'About', route: '/about' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="grid" size={24} color="#282828" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search-outline" size={24} color="#282828" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Image
                  source={{ 
                    uri: profileImage || 'https://placekitten.com/100/100',
                    cache: 'force-cache'
                  }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.error('Error loading profile image:', e.nativeEvent.error);
                    setProfileImage(null);
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>Menu</Text>
          <Text style={styles.subtitle}>Quick access to features</Text>

          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, item.comingSoon && styles.disabledMenuItem]}
                onPress={() => !item.comingSoon && router.push(item.route)}
                disabled={item.comingSoon}
              >
                <BlurView intensity={40} tint="light" style={[styles.menuItemContent, item.comingSoon && styles.disabledMenuItemContent]}>
                  <View style={[styles.iconContainer, item.comingSoon && styles.disabledIconContainer]}>
                    <Ionicons name={item.icon} size={24} color={item.comingSoon ? '#999' : '#282828'} />
                  </View>
                  <Text style={[styles.menuText, item.comingSoon && styles.disabledMenuText]}>{item.title}</Text>
                  {item.comingSoon && (
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  )}
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#282828',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 16,
  },
  menuItemContent: {
    flex: 1,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#282828',
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disabledMenuItem: {
    opacity: 0.7,
  },
  disabledMenuItemContent: {
    backgroundColor: 'rgba(230, 230, 230, 0.8)',
  },
  disabledIconContainer: {
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  disabledMenuText: {
    color: '#999',
  },
}); 