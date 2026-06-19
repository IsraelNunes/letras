import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAssets } from 'expo-asset';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { SessionStorage } from '../../infra/storage/session-storage';
import { LearnerRootStackParamList } from '../../types';
import { EducatorBottomMenu } from '../educator/components/EducatorBottomMenu';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerProfile'>;

function formatPhone(digits?: string | null) {
  if (!digits) return '—';
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length < 10) return d;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface LearnerProfileData {
  id: string;
  displayName: string;
  cpfOrPassport?: string | null;
  phoneDigits?: string | null;
  birthDate?: string | null;
  uf?: string | null;
  city?: string | null;
  photoUri?: string | null;
  educator?: { id: string; name: string } | null;
}

export function LearnerProfileView({ navigation }: Props) {
  const [profile, setProfile] = useState<LearnerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const profileId = await SessionStorage.getLearnerProfileId();
        if (!profileId) {
          setErrorMessage('Sessão não encontrada.');
          return;
        }
        const data = await httpClient.get<LearnerProfileData>(`/cadastros/alfabetizandos/${profileId}`);
        if (mounted) setProfile(data);
      } catch (error) {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar perfil.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await SessionStorage.clearLearnerSession();
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'LearnerFlow' }] }),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : null} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri ? (
              <SvgUri uri={logoUri} width={84} height={50} />
            ) : (
              <ActivityIndicator size="small" color="#111827" />
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color="#101010" />
            <Text style={styles.loadingText}>Carregando perfil...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.loadingBlock}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : profile ? (
          <View style={styles.body}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {profile.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}

            <InfoRow label="Nome" value={profile.displayName ?? '—'} />
            <InfoRow label="CPF / Passaporte" value={profile.cpfOrPassport ?? '—'} />
            <InfoRow label="Celular" value={formatPhone(profile.phoneDigits)} />
            <InfoRow label="Data de Nascimento" value={profile.birthDate ?? '—'} />
            <InfoRow label="UF" value={profile.uf ?? '—'} />
            <InfoRow label="Cidade" value={profile.city ?? '—'} />
            {profile.educator ? (
              <InfoRow label="Alfabetizador vinculado" value={profile.educator.name} />
            ) : null}

            <Pressable style={styles.logoutButton} onPress={() => void handleLogout()}>
              <Text style={styles.logoutLabel}>LOG OUT</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <EducatorBottomMenu
        active="perfil"
        onInicioPress={() => navigation.navigate('LearnerHome')}
        onTutorialPress={() => navigation.navigate('LearnerHome')}
        onAcompanharPress={() => navigation.navigate('LearnerHome')}
        onPontuacaoPress={() => navigation.navigate('LearnerScore')}
        onPerfilPress={() => {}}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
    paddingBottom: 130,
    backgroundColor: '#ededed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: { paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 4 },
  backText: { fontSize: 15, color: '#20385f', fontWeight: '500' },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  loadingBlock: {
    marginTop: 80,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#222222',
    fontSize: 14,
  },
  errorText: {
    color: '#9e1b1b',
    fontSize: 13,
    textAlign: 'center',
  },
  body: {
    marginTop: 24,
    gap: 2,
    alignItems: 'flex-start',
  },
  photo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 18,
    alignSelf: 'center',
  },
  photoPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#20385f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    alignSelf: 'center',
  },
  photoPlaceholderText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  infoRow: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d4',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#141414',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 32,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 4,
  },
  logoutLabel: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
