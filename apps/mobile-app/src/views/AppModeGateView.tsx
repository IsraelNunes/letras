import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppModeStorage } from '../infra/storage/app-mode-storage';
import { EducatorStorage } from '../infra/storage/educator-storage';
import { SessionStorage } from '../infra/storage/session-storage';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AppModeGate'>;

function isSessionStillValid(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiry = new Date(expiresAt).getTime();

  if (!Number.isFinite(expiry)) {
    return false;
  }

  return expiry > Date.now();
}

export function AppModeGateView({ navigation }: Props) {
  const [loading, setLoading] = useState(true);

  const goToMode = useCallback(
    async (mode: 'educator' | 'learner') => {
      await AppModeStorage.setPreferredMode(mode);
      navigation.replace(mode === 'educator' ? 'EducatorFlow' : 'LearnerFlow');
    },
    [navigation],
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        const [preferredMode, token, expiresAt, learnerProfileId] = await Promise.all([
          AppModeStorage.getPreferredMode(),
          EducatorStorage.getAuthToken(),
          EducatorStorage.getAuthSessionExpiry(),
          SessionStorage.getLearnerProfileId(),
        ]);

        if (token && isSessionStillValid(expiresAt)) {
          await AppModeStorage.setPreferredMode('educator');
          navigation.replace('EducatorFlow');
          return;
        }

        if (learnerProfileId) {
          await AppModeStorage.setPreferredMode('learner');
          navigation.replace('LearnerFlow');
          return;
        }

        if (preferredMode) {
          navigation.replace(preferredMode === 'educator' ? 'EducatorFlow' : 'LearnerFlow');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Preparando o Letras...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Letras Mobile</Text>
        <Text style={styles.subtitle}>Escolha como deseja entrar no aplicativo.</Text>

        <Pressable style={styles.primaryButton} onPress={() => void goToMode('educator')}>
          <Text style={styles.primaryButtonText}>Entrar como Educador</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => void goToMode('learner')}>
          <Text style={styles.secondaryButtonText}>Entrar como Aprendiz</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f2f2f2',
  },
  loadingText: {
    fontSize: 16,
    color: '#111827',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#111827',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
});
