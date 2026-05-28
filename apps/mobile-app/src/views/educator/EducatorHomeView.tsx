import { useAssets } from 'expo-asset';
import { useCallback, useEffect, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorHome'>;

interface LearnerItem {
  id: string;
  displayName: string;
  city?: string | null;
  uf?: string | null;
  cpfOrPassport?: string | null;
}

export function EducatorHomeView({ navigation, route }: Props) {
  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Educador';
  const educatorId = route.params?.educatorId;

  const [learners, setLearners] = useState<LearnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchLearners = useCallback(async () => {
    if (!educatorId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await httpClient.get<LearnerItem[]>(
        `/cadastros/alfabetizandos?educatorId=${educatorId}`,
      );
      setLearners(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao carregar lista.');
    } finally {
      setIsLoading(false);
    }
  }, [educatorId]);

  useEffect(() => {
    void fetchLearners();
  }, [fetchLearners]);

  // Recarrega ao voltar para esta tela (após cadastrar um novo)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void fetchLearners();
    });
    return unsubscribe;
  }, [fetchLearners, navigation]);

  const handleNewLearner = () => {
    navigation.navigate('LearnerOnboardingStep1', { isEducatorFlow: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri ? (
              <SvgUri uri={logoUri} width={84} height={50} />
            ) : (
              <ActivityIndicator size="small" color="#111827" />
            )}
          </View>

          <Pressable style={styles.notificationButton} onPress={() => {}}>
            <Image source={require('../../../assets/notificacao.png')} style={styles.notificationIcon} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.greeting}>Ola, {educatorName}.</Text>
          <Text style={styles.subtitle}>Acompanhe seus alfabetizandos.</Text>

          <Pressable style={styles.newLearnerButton} onPress={handleNewLearner}>
            <Text style={styles.newLearnerButtonText}>+ NOVO ALFABETIZANDO</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Alfabetizandos</Text>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#111111" />
          ) : fetchError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Erro ao carregar.</Text>
              <Text style={styles.emptyText}>{fetchError}</Text>
            </View>
          ) : learners.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum alfabetizando vinculado.</Text>
              <Text style={styles.emptyText}>
                Quando voce vincular um alfabetizando, ele aparece aqui com a etapa atual
                de alfabetizacao.
              </Text>
            </View>
          ) : (
            <View style={styles.learnerList}>
              {learners.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.learnerCard}
                  onPress={() => navigation.navigate('EducatorLearningMode', {
                    fullName: educatorName,
                    educatorId,
                    learnerName: item.displayName,
                    learnerId: item.id,
                  })}
                >
                  <View style={styles.learnerAvatar}>
                    <Text style={styles.learnerAvatarText}>
                      {item.displayName.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.learnerInfo}>
                    <Text style={styles.learnerName}>{item.displayName}</Text>
                    {item.city && item.uf ? (
                      <Text style={styles.learnerLocation}>
                        {item.city}, {item.uf}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onTutorialPress={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
        onAcompanharPress={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
        onPontuacaoPress={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
        onPerfilPress={() => navigation.navigate('EducatorProfile')}
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
    paddingTop: 28,
    paddingBottom: 130,
    backgroundColor: '#ededed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  notificationButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    right: 1,
    top: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  body: {
    marginTop: 28,
  },
  greeting: {
    color: '#1a1a1a',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#3a3a3a',
    fontSize: 14,
  },
  newLearnerButton: {
    marginTop: 22,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newLearnerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    marginTop: 26,
    color: '#1a1a1a',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  emptyTitle: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#5a5a5a',
    fontSize: 13,
    lineHeight: 20,
  },
  learnerList: {
    marginTop: 12,
    gap: 8,
  },
  learnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  learnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  learnerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  learnerInfo: {
    flex: 1,
  },
  learnerName: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  learnerLocation: {
    marginTop: 2,
    color: '#5a5a5a',
    fontSize: 12,
  },
});
