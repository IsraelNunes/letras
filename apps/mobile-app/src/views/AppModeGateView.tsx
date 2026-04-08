import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAssets } from 'expo-asset';
import { useCallback } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { AppModeStorage } from '../infra/storage/app-mode-storage';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AppModeGate'>;

export function AppModeGateView({ navigation }: Props) {
  const [assets] = useAssets([require('../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const goToMode = useCallback(
    async (mode: 'educator' | 'learner') => {
      await AppModeStorage.setPreferredMode(mode);
      navigation.replace(mode === 'educator' ? 'EducatorFlow' : 'LearnerFlow');
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {logoUri ? <SvgUri uri={logoUri} width={220} height={128} /> : null}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 380,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: '100%',
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
    paddingHorizontal: 18,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
});
