import React from 'react';
import { Dialog, Button, Text, useTheme } from 'react-native-paper';
import { View } from 'react-native';

interface Props {
  visible: boolean;
  featureName: string;
  onDismiss: () => void;
  onUpgrade: () => void;
}

export const PremiumFeaturePopup: React.FC<Props> = ({ visible, featureName, onDismiss, onUpgrade }) => {
  const theme = useTheme();

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Content>
        <Text variant="headlineSmall" style={{ marginBottom: 12, fontWeight: '600' }}>
          ✨ Premium Feature
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
          {`${featureName} is available for premium members. Upgrade to unlock this feature and enjoy an ad-free experience!`}
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>
          Later
        </Button>
        <Button mode="contained" onPress={onUpgrade}>
          Upgrade
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
