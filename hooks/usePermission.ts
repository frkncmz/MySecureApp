import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

type PermissionType = 'photoLibrary';

interface PermissionConfig {
  title: string;
  description: string;
}

export function usePermission(type: PermissionType) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [onGranted, setOnGranted] = useState<(() => void) | null>(null);

  const config: PermissionConfig = {
    title: t('onboarding.photo_access_title', { defaultValue: 'Photo Library Access' }),
    description: t('onboarding.photo_access_desc', { defaultValue: 'LoveLog needs access to your photo library to add profile photos for your flirts.' }),
  };

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
          t('permissions.photo_library.alert_title', { defaultValue: 'Photo Access Not Available' }),
          t('permissions.photo_library.alert_desc', { defaultValue: 'This feature uses your photo library. You can enable access anytime in Settings.' }),
          [
            { text: t('permissions.photo_library.not_now', { defaultValue: 'Not Now' }), style: 'cancel' },
            {
              text: t('permissions.photo_library.settings', { defaultValue: 'Settings' }),
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
    [type, config, t]
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
