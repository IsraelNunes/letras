import { useAssets } from 'expo-asset';
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
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorHome'>;

// Por enquanto a lista de alfabetizandos vinculados ainda nao tem fonte de
// dados real (vai chegar com a integracao do realtime/painel). Renderizamos
// um estado vazio amigavel ate la, em vez de inventar dados placeholder.
const HAS_LEARNERS = false;

export function EducatorHomeView({ navigation, route }: Props) {
  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Educador';

  const handleNewLearner = () => {
    // O fluxo completo de cadastro/vinculacao ainda nao existe; por enquanto
    // mandamos direto pra tela de escolha "individualmente ou em grupo" como
    // primeiro passo, passando o contexto de que e um novo aluno (sem nome
    // ainda — sera capturado na vinculacao).
    navigation.navigate('EducatorLearningMode', {
      fullName: educatorName,
    });
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

          {HAS_LEARNERS ? null : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum alfabetizando vinculado.</Text>
              <Text style={styles.emptyText}>
                Quando voce vincular um alfabetizando, ele aparece aqui com a etapa atual
                de alfabetizacao.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onInicioPress={() => navigation.navigate('EducatorHome', { fullName: educatorName })}
        onTutorialPress={() => navigation.navigate('EducatorHome', { fullName: educatorName })}
        onAcompanharPress={() => navigation.navigate('EducatorHome', { fullName: educatorName })}
        onPontuacaoPress={() => navigation.navigate('EducatorHome', { fullName: educatorName })}
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
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newLearnerButtonText: {
    color: '#1a1a1a',
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
});
