import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, createLocalId } from '@letras/shared-utils';

export class EducatorStorage {
  static async getOrCreateEducatorDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.EDUCATOR_DEVICE_ID);

    if (existing) {
      return existing;
    }

    const created = createLocalId('educator-device');
    await AsyncStorage.setItem(STORAGE_KEYS.EDUCATOR_DEVICE_ID, created);
    return created;
  }
}
