import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const sizes = {
    small: { icon: 24, text: 10, dot: 2 },
    medium: { icon: 32, text: 12, dot: 3 },
    large: { icon: 48, text: 16, dot: 4 }
  };

  const currentSize = sizes[size];

  const renderDots = () => {
    const dots = [];
    const dotCount = 8;
    const radius = currentSize.icon * 0.8;
    
    for (let i = 0; i < dotCount; i++) {
      const angle = (i * 2 * Math.PI) / dotCount;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: currentSize.dot,
              height: currentSize.dot,
              left: x,
              top: y,
            },
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.dropContainer, { 
        width: currentSize.icon * 1.2, 
        height: currentSize.icon * 1.4 
      }]}>
        <View style={[styles.drop, { 
          width: currentSize.icon, 
          height: currentSize.icon * 1.2,
          borderWidth: currentSize.icon * 0.08
        }]}>
          <View style={[styles.dropInner, { 
            width: currentSize.icon * 0.8, 
            height: currentSize.icon * 1
          }]} />
          {showText && (
            <Text style={[styles.text, { 
              fontSize: currentSize.text,
              top: currentSize.icon * 0.3
            }]}>
              GT
            </Text>
          )}
          <View style={[styles.dot, { 
            width: currentSize.dot, 
            height: currentSize.dot,
            left: currentSize.icon * 0.45,
            top: currentSize.icon * 0.55
          }]} />
          <View style={[styles.dot, { 
            width: currentSize.dot, 
            height: currentSize.dot,
            left: currentSize.icon * 0.55,
            top: currentSize.icon * 0.55
          }]} />
        </View>
        <View style={[styles.dropHighlight, { 
          width: currentSize.icon * 0.4, 
          height: currentSize.icon * 0.4,
          top: currentSize.icon * 0.2,
          left: currentSize.icon * 0.2
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  drop: {
    borderColor: '#FF6B6B',
    borderRadius: 999,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  dropInner: {
    backgroundColor: '#FF6B6B',
    borderRadius: 999,
    position: 'absolute',
  },
  dropHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
    position: 'absolute',
  },
  dot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    position: 'absolute',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
    position: 'absolute',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 