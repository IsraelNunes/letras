import { useMemo, useState } from 'react';
import { useAssets } from 'expo-asset';
import {
  ActivityIndicator,
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
import { EducatorRootStackParamList } from '../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLogin'>;

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

function isValidCpf(value: string) {
  return normalizeDigits(value).length === 11;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function EducatorLoginView({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [assets] = useAssets([require('../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const isIdentifierValid = useMemo(
    () => isValidCpf(identifier) || isValidEmail(identifier),
    [identifier],
  );
  const isPasswordValid = useMemo(() => password.trim().length >= 6, [password]);
  const canLogin = isIdentifierValid && isPasswordValid;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          {logoUri ? <SvgUri uri={logoUri} width={94} height={56} /> : <ActivityIndicator size="small" color="#111" />}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Entrar no Letras Educador</Text>
          <Text style={styles.subtitle}>Use seu CPF e senha para continuar.</Text>

          <Text style={styles.label}>CPF ou Email *</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            style={[styles.input, identifier.length > 0 && !isIdentifierValid ? styles.inputInvalid : null]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="CPF (11 digitos) ou email"
            placeholderTextColor="#7a7a7a"
          />

          <Text style={styles.label}>Senha *</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={[styles.input, password.length > 0 && !isPasswordValid ? styles.inputInvalid : null]}
            secureTextEntry
            placeholder="Minimo 6 caracteres"
            placeholderTextColor="#7a7a7a"
          />

          <Pressable
            style={[styles.loginButton, !canLogin ? styles.loginButtonDisabled : null]}
            onPress={() => navigation.replace('EducatorDashboard')}
            disabled={!canLogin}
          >
            <Text style={styles.loginButtonText}>ENTRAR</Text>
          </Pressable>

          <Pressable style={styles.registerLink} onPress={() => navigation.navigate('EducatorSplash')}>
            <Text style={styles.registerLinkText}>Primeiro acesso? Fazer cadastro</Text>
          </Pressable>
        </View>
      </ScrollView>

      <EducatorBottomMenu
        active="perfil"
        onInicioPress={() => navigation.navigate('EducatorLogin')}
        onTutorialPress={() => navigation.navigate('EducatorSplash')}
      />
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
    paddingTop: 36,
    paddingBottom: 130,
    backgroundColor: '#ededed',
  },
  logoWrap: {
    minHeight: 56,
    justifyContent: 'center',
  },
  body: {
    marginTop: 58,
  },
  title: {
    fontSize: 29 / 1.4,
    lineHeight: 30,
    color: '#111111',
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    color: '#333333',
    maxWidth: 320,
  },
  label: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#101010',
    fontWeight: '500',
  },
  input: {
    height: 42,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 12,
    color: '#111111',
    fontSize: 16,
    fontWeight: '500',
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: '#9e1b1b',
  },
  loginButton: {
    marginTop: 32,
    height: 46,
    borderRadius: 3,
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.4,
  },
  loginButtonText: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  registerLink: {
    marginTop: 18,
    alignSelf: 'center',
  },
  registerLinkText: {
    color: '#1f2937',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
