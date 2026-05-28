import { useAssets } from 'expo-asset';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { LearnerSessionRepositoryImpl } from '../../data/repositories/learner/learner-session-repository.impl';
import { SessionStorage } from '../../infra/storage/session-storage';
import { LearnerRootStackParamList } from '../../types';
import { useOptionalLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerCpfLogin'>;

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

function maskCpf(value: string) {
  const d = normalizeDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isAllDigits(value: string) {
  return /^\d+$/.test(value.replace(/[.\-\s]/g, ''));
}

export function LearnerCpfLoginView({ navigation }: Props) {
  const repository = useMemo(() => new LearnerSessionRepositoryImpl(), []);
  const session = useOptionalLearnerSession();

  const [cpfOrPassport, setCpfOrPassport] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [assets] = useAssets([
    require('../../../assets/Logo-LETRAS.svg'),
    require('../../../assets/avançar.svg'),
  ]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const forwardUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;

  const looksLikeCpf = useMemo(
    () => isAllDigits(cpfOrPassport) && normalizeDigits(cpfOrPassport).length <= 11,
    [cpfOrPassport],
  );

  const isValid = useMemo(() => {
    if (!cpfOrPassport) return false;
    if (looksLikeCpf) return normalizeDigits(cpfOrPassport).length === 11;
    return cpfOrPassport.trim().length >= 6;
  }, [cpfOrPassport, looksLikeCpf]);

  const handleCpfChange = (text: string) => {
    if (isAllDigits(text.replace(/[.\-]/g, '')) || text === '') {
      setCpfOrPassport(maskCpf(text));
    } else {
      setCpfOrPassport(text.toUpperCase().slice(0, 20));
    }
  };

  const handleEntrar = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      const learner = await repository.lookupLearner(cpfOrPassport.trim(), undefined);
      await SessionStorage.setLearnerProfileId(learner.id);
      if (session) await session.initialize();
      navigation.reset({ index: 0, routes: [{ name: 'LearnerHome' }] });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Não foi possível localizar o cadastro.';
      Alert.alert('Cadastro não encontrado', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : null} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        <View style={styles.logoWrap}>
          {logoUri ? (
            <SvgUri uri={logoUri} width={84} height={50} />
          ) : (
            <ActivityIndicator size="small" color="#111827" />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.intro}>Informe seu CPF ou passaporte para continuar.</Text>

          <Text style={styles.label}>
            CPF ou passaporte: <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={cpfOrPassport}
            onChangeText={handleCpfChange}
            style={styles.input}
            placeholder=""
            placeholderTextColor="#7a7a7a"
            keyboardType="default"
            autoCapitalize="characters"
            autoFocus
          />
        </View>

        <Pressable
          style={[styles.advanceButton, (!isValid || isLoading) ? styles.advanceButtonDisabled : null]}
          disabled={!isValid || isLoading}
          onPress={() => void handleEntrar()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#20385f" />
          ) : forwardUri ? (
            <SvgUri uri={forwardUri} width={64} height={40} />
          ) : (
            <ActivityIndicator size="small" color="#20385f" />
          )}
          <Text style={styles.advanceLabel}>ENTRAR</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ededed',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 60,
    backgroundColor: '#ededed',
  },
  backButton: { paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#20385f', fontWeight: '500' },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  body: {
    marginTop: 36,
    gap: 8,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: '#141414',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    color: '#141414',
  },
  required: {
    color: '#b91c1c',
  },
  input: {
    height: 38,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 12,
    color: '#111111',
    fontSize: 16,
    fontWeight: '500',
  },
  advanceButton: {
    marginTop: 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  advanceButtonDisabled: {
    opacity: 0.35,
  },
  advanceLabel: {
    fontSize: 17,
    lineHeight: 21,
    color: '#101010',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
});
