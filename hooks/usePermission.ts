import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type PermissionType = 'photoLibrary';

interface PermissionConfig {
  title: string;
  description: string;
}

const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  photoLibrary: {
    title: 'Photo Library Access',
    description:
      'LoveLog needs access to your photo library to add profile photos for your flirts.',
  },
};

export function usePermission(type: PermissionType) {
  const [modalVisible, setModalVisible] = useState(false);
  const [onGranted, setOnGranted] = useState<(() => void) | null>(null);

  const config = PERMISSION_CONFIGS[type];

  const requestPermission = useCallback(
    async (callback: () => void) => {
      // First check if already granted
      const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (existingPermission.granted) {
        // Already granted — just call callback directly
        callback();
        return;
      }

      if (!existingPermission.canAskAgain) {
        // Previously denied permanently — show neutral info with Settings link
        Alert.alert(
          'Photo Access Not Available',
          'This feature uses your photo library. You can enable access anytime in Settings.',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      // Not yet asked or denied but can ask again — show our custom modal
      setOnGranted(() => callback);
      setModalVisible(true);
    },
    [type, config]
  );

  const handleContinue = useCallback(async () => {
    setModalVisible(false);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted) {
      // Permission granted — call the callback
      onGranted?.();
    }
    // If denied — do nothing, respect the user's decision.
    // Next time they tap the photo button, requestPermission will handle it.
  }, [type, config, onGranted]);

  return {
    modalVisible,
    modalConfig: config,
    requestPermission,
    handleContinue,
  };
}
