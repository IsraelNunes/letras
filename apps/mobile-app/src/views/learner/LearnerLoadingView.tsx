import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SessionStorage } from '../../infra/storage/session-storage';
import { LearnerRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLoading'>;

const LOCAL_PROFILE_PREFIX = 'learner-local-profile';

export function LearnerLoadingView({ navigation }: Props) {
  useEffect(() => {
    SessionStorage.getLearnerProfileId().then((id) => {
      const hasRealProfile = Boolean(id && !id.startsWith(`${LOCAL_PROFILE_PREFIX}-`));
      if (hasRealProfile) {
        navigation.replace('LearnerHome');
      } else {
        navigation.replace('LearnerFirstAccessGate');
      }
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#111111" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ededed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
