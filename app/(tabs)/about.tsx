import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Logo from '../../components/Logo';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface JourneyItem {
  date: string;
  title: string;
  description: string;
}

export default function AboutScreen() {
  const router = useRouter();
  const [pressedButtons, setPressedButtons] = useState<{ [key: string]: boolean }>({});
  const [journey, setJourney] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch journey
      const { data: journeyData, error: journeyError } = await supabase
        .from('app_journey')
        .select('*')
        .order('date', { ascending: true });

      if (journeyError) throw journeyError;
      setJourney(journeyData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: 'car-outline',
      title: 'Fuel Tracking',
      description: 'Easily log your fuel expenses with details like gallons, price, and mileage.'
    },
    {
      icon: 'analytics-outline',
      title: 'Analytics',
      description: 'Get detailed insights into your fuel consumption, costs, and vehicle performance.'
    },
    {
      icon: 'card-outline',
      title: 'Payment Management',
      description: 'Track your payments and maintain a balance of your fuel expenses.'
    },
    {
      icon: 'calendar-outline',
      title: 'Service Reminders',
      description: 'Never miss a service with smart maintenance predictions and reminders.'
    },
    {
      icon: 'trending-up-outline',
      title: 'Cost Analysis',
      description: 'Analyze your fuel costs over time with interactive charts and trends.'
    },
    {
      icon: 'speedometer-outline',
      title: 'Performance Metrics',
      description: 'Monitor your vehicle\'s MPG and overall performance metrics.'
    }
  ];

  const socialLinks = [
    {
      name: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://x.com/surenjanath',
      color: '#1DA1F2',
      hoverColor: '#1a8cd8'
    },
    {
      name: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://www.facebook.com/InsightFusion.Tech',
      color: '#1877F2',
      hoverColor: '#166fe5'
    },
    {
      name: 'Instagram',
      icon: 'logo-instagram',
      url: 'https://www.instagram.com/surenjanath',
      color: '#E4405F',
      hoverColor: '#d32f4f'
    },
    {
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      url: 'https://www.linkedin.com/in/surenjanath/',
      color: '#0A66C2',
      hoverColor: '#0956a3'
    }
  ];

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const handlePressIn = (name: string) => {
    setPressedButtons(prev => ({ ...prev, [name]: true }));
  };

  const handlePressOut = (name: string) => {
    setPressedButtons(prev => ({ ...prev, [name]: false }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#282828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <View style={styles.appInfo}>
            <Logo size="large" showText={true} />
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          <Text style={styles.description}>
            GasTracker is your comprehensive solution for managing and tracking your vehicle's fuel expenses and maintenance. 
            Designed with simplicity and efficiency in mind, it helps you stay on top of your vehicle's performance and costs.
          </Text>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <BlurView key={index} intensity={40} tint="light" style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon} size={24} color="#282828" />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </BlurView>
              ))}
            </View>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Connect With Us</Text>
            <BlurView intensity={40} tint="light" style={styles.socialCard}>
              <View style={styles.socialHeader}>
                <View style={styles.socialLogo}>
                  <Ionicons name="share-social" size={24} color="#FF6B6B" />
                </View>
                <Text style={styles.socialTitle}>Join Our Community</Text>
              </View>

              <View style={styles.socialGrid}>
                {socialLinks.map((social, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.socialItem,
                      { 
                        backgroundColor: pressedButtons[social.name] ? social.hoverColor : social.color,
                        transform: [{ scale: pressedButtons[social.name] ? 0.95 : 1 }]
                      }
                    ]}
                    onPress={() => handleSocialLink(social.url)}
                    onPressIn={() => handlePressIn(social.name)}
                    onPressOut={() => handlePressOut(social.name)}
                    activeOpacity={1}
                  >
                    <View style={styles.socialIconContainer}>
                      <Ionicons name={social.icon} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialText}>{social.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <BlurView intensity={40} tint="light" style={styles.legalCard}>
              <Text style={styles.legalText}>
                © 2025 GasTracker. All rights reserved.
              </Text>
              <Text style={styles.legalText}>
                Privacy Policy | Terms of Service
              </Text>
            </BlurView>
          </View>

          <View style={styles.creatorSection}>
            <Text style={styles.sectionTitle}>Created By</Text>
            <BlurView intensity={40} tint="light" style={styles.creatorCard}>
              <View style={styles.creatorHeader}>
                <View style={styles.creatorLogo}>
                  <Ionicons name="code-slash" size={32} color="#FF6B6B" />
                </View>
                <Text style={styles.creatorTitle}>InsightFusion Tech</Text>
              </View>
              
              <View style={styles.creatorInfo}>
                <View style={styles.creatorRow}>
                  <Ionicons name="person-circle-outline" size={24} color="#FF6B6B" />
                  <Text style={styles.creatorLabel}>Developer</Text>
                  <Text style={styles.creatorValue}>Surenjanath Singh</Text>
                </View>
                
                <View style={styles.creatorRow}>
                  <Ionicons name="mail-outline" size={24} color="#FF6B6B" />
                  <Text style={styles.creatorLabel}>Email</Text>
                  <Text style={styles.creatorValue}>surenjanath.singh@gmail.com</Text>
                </View>
                
                <View style={styles.creatorRow}>
                  <Ionicons name="briefcase-outline" size={24} color="#FF6B6B" />
                  <Text style={styles.creatorLabel}>Company</Text>
                  <Text style={styles.creatorValue}>InsightFusion Tech</Text>
                </View>
              </View>

              <View style={styles.creatorFooter}>
                <Text style={styles.creatorQuote}>
                  "Innovating solutions for a smarter tomorrow"
                </Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.suggestionSection}>
            <Text style={styles.sectionTitle}>Suggestions & Feedback</Text>
            <BlurView intensity={40} tint="light" style={styles.suggestionCard}>
              <Text style={styles.suggestionText}>
                We value your input! Help us improve GasTracker by sharing your suggestions and feedback.
              </Text>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => Linking.openURL('mailto:surenjanath.singh@gmail.com?subject=GasTracker%20Feedback')}
              >
                <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                <Text style={styles.suggestionButtonText}>Send Feedback</Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          <View style={styles.journeySection}>
            <Text style={styles.sectionTitle}>Our Journey</Text>
            <BlurView intensity={40} tint="light" style={styles.journeyCard}>
              <View style={styles.timeline}>
                {journey.map((item, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{item.date}</Text>
                      <Text style={styles.timelineTitle}>{item.title}</Text>
                      <Text style={styles.timelineDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </BlurView>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  socialSection: {
    marginBottom: 24,
  },
  socialCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    overflow: 'hidden',
  },
  socialHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  socialLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#282828',
    textAlign: 'center',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  legalSection: {
    marginBottom: 32,
  },
  legalCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  legalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  creatorSection: {
    marginBottom: 32,
  },
  creatorCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    overflow: 'hidden',
  },
  creatorHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  creatorLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  creatorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#282828',
    textAlign: 'center',
  },
  creatorInfo: {
    gap: 16,
    marginBottom: 24,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    gap: 12,
  },
  creatorLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  creatorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
  },
  creatorFooter: {
    padding: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  creatorQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  suggestionSection: {
    marginBottom: 32,
  },
  suggestionCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  suggestionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  suggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  journeySection: {
    marginBottom: 24,
  },
  journeyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    overflow: 'hidden',
  },
  timeline: {
    gap: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#282828',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 