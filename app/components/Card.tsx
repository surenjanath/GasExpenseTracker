import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  style?: any;
}

export const Card = ({ title, value, subtitle, style }: CardProps) => {
  return (
    <BlurView intensity={20} tint="light" style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </BlurView>
  );
};

export default Card;

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    minWidth: 100,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: '#282828',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
}); 