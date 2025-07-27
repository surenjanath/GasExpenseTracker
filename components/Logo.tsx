import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const sizes = {
    small: { icon: 24, text: 16 },
    medium: { icon: 32, text: 20 },
    large: { icon: 48, text: 24 }
  };

  const currentSize = sizes[size];
  const scale = currentSize.icon / 48; // Base size is 48

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { 
        width: currentSize.icon * 2, 
        height: currentSize.icon * 2,
        backgroundColor: '#4A90E2',
        borderRadius: currentSize.icon
      }]}>
        <Svg 
          width={currentSize.icon * 1.5} 
          height={currentSize.icon * 1.5} 
          viewBox="0 0 72 72"
          style={styles.svg}
        >
          {/* Car silhouette */}
          <Path
            d="M18 36
               C18 31.5 20.25 29.25 24.75 29.25
               H47.25
               C51.75 29.25 54 31.5 54 36
               V40.5
               C54 45 51.75 47.25 47.25 47.25
               H24.75
               C20.25 47.25 18 45 18 40.5
               V36Z"
            fill="white"
          />

          {/* Gas nozzle */}
          <Path
            d="M31.5 29.25
               V24.75
               C31.5 22.5 32.625 21.375 34.875 21.375
               H37.125
               C39.375 21.375 40.5 22.5 40.5 24.75
               V29.25"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Gas hose */}
          <Path
            d="M36 21.375
               V15.75"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Nozzle top */}
          <Path
            d="M30.375 15.75
               H41.625"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Wheels */}
          <Circle cx="27" cy="38.25" r="2.25" fill="#4A90E2" />
          <Circle cx="45" cy="38.25" r="2.25" fill="#4A90E2" />
        </Svg>
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: currentSize.text }]}>
          GasTracker
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  svg: {
    transform: [{ scale: 1.2 }],
  },
  text: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
}); 