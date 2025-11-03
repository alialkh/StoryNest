import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FormattedText } from './FormattedText';
import type { TextProps } from 'react-native-paper';

interface ZoomableTextProps {
  content: string;
  variant?: TextProps<any>['variant'];
  style?: any;
  textSize?: 'small' | 'normal' | 'large';
}

export const ZoomableText: React.FC<ZoomableTextProps> = ({ content, variant = 'bodyMedium', style, textSize = 'normal' }) => {
  // Map text sizes to line height multipliers
  const sizeMultiplier = textSize === 'small' ? 1 : textSize === 'large' ? 1.3 : 1.15;
  
  return (
    <View style={styles.container}>
      <FormattedText
        content={content}
        variant={variant}
        style={[style, { lineHeight: (style?.lineHeight || 22) * sizeMultiplier }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
});
