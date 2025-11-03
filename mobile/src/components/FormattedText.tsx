import React from 'react';
import { Text as RNText, StyleProp, TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { parseFormattedText, FormattedSegment } from '../utils/text';

interface Props {
  content: string;
  variant?: any;
  style?: StyleProp<TextStyle>;
}

export const FormattedText: React.FC<Props> = ({ content, variant = 'bodyMedium', style }) => {
  const segments = parseFormattedText(content);
  const theme = useTheme();

  if (segments.length === 0) {
    return <Text variant={variant} style={style}>{content}</Text>;
  }

  return (
    <RNText style={style}>
      {segments.map((segment, idx) => {
        switch (segment.type) {
          case 'bold':
            return (
              <Text key={idx} variant={variant} style={{ fontWeight: '700' }}>
                {segment.text}
              </Text>
            );
          case 'italic':
            return (
              <Text key={idx} variant={variant} style={{ fontStyle: 'italic' }}>
                {segment.text}
              </Text>
            );
          default:
            return (
              <Text key={idx} variant={variant}>
                {segment.text}
              </Text>
            );
        }
      })}
    </RNText>
  );
};
