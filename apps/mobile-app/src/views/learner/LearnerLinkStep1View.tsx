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
import { LearnerRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLinkStep1'>;

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

function formatPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length < 11) return d;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}


export function LearnerLinkStep1View({ navigation }: Props) {
  const repository = useMemo(() => new LearnerSessionRepositoryImpl(), []);

  const [cpfOrPassport, setCpfOrPassport] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
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

  const isCpfOrPassportValid = useMemo(() => {
    if (!cpfOrPassport) return false;
    if (looksLikeCpf) return normalizeDigits(cpfOrPassport).length === 11;
    return cpfOrPassport.trim().length >= 6;
  }, [cpfOrPassport, looksLikeCpf]);

  const isPhoneValid = useMemo(() => phoneDigits.length === 11, [phoneDigits]);

  const canProceed = isCpfOrPassportValid || isPhoneValid;

  const phoneDisplay = useMemo(
    () => (phoneDigits.length === 11 ? formatPhone(phoneDigits) : phoneDigits),
    [phoneDigits],
  );

  const handleCpfChange = (text: string) => {
    if (isAllDigits(text.replace(/[.\-]/g, '')) || text === '') {
      setCpfOrPassport(maskCpf(text));
    } else {
      setCpfOrPassport(text.toUpperCase().slice(0, 20));
    }
  };

  const handleAvançar = async () => {
    if (!canProceed || isLoading) return;
    setIsLoading(true);
    try {
      const cpfRaw = isCpfOrPassportValid ? cpfOrPassport.trim() : undefined;
      const phoneRaw = isPhoneValid ? phoneDigits : undefined;

      const learner = await repository.lookupLearner(cpfRaw, phoneRaw);

      navigation.navigate('LearnerLinkSuccess', {
        learnerId: learner.id,
        learnerName: learner.displayName,
        educatorName: learner.educator?.name ?? 'Educador',
      });
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
          <Text style={styles.intro}>
            O cadastro do alfabetizando já foi feito no celular do alfabetizador. Agora, é só vincular.
          </Text>

          <Text style={styles.label}>
            Insira o CPF ou passaporte do alfabetizando: <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={cpfOrPassport}
            onChangeText={handleCpfChange}
            style={styles.input}
            placeholder=""
            placeholderTextColor="#7a7a7a"
            keyboardType="default"
            autoCapitalize="characters"
          />

          <Text style={styles.orLabel}>ou</Text>
          <Text style={styles.label}>Insira o número do telefone celular do alfabetizando:</Text>
          <TextInput
            value={phoneDisplay}
            onChangeText={(text) => setPhoneDigits(normalizeDigits(text).slice(0, 11))}
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="(XX) XXXXX-XXXX"
            placeholderTextColor="#7a7a7a"
          />
        </View>

        <Pressable
          style={[styles.advanceButton, (!canProceed || isLoading) ? styles.advanceButtonDisabled : null]}
          disabled={!canProceed || isLoading}
          onPress={() => void handleAvançar()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#20385f" />
          ) : forwardUri ? (
            <SvgUri uri={forwardUri} width={64} height={40} />
          ) : (
            <ActivityIndicator size="small" color="#20385f" />
          )}
          <Text style={styles.advanceLabel}>AVANÇAR</Text>
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
    fontWeight: '400',
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
  orLabel: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
    marginBottom: 4,
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
