import { useState } from 'react';
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

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLearningMode'>;
type LearningMode = 'individual' | 'group' | null;

// POC: o suporte a grupos esta desligado por enquanto (decisao registrada em
// CLAUDE.md secao 2). A tela continua aparecendo no fluxo de vinculacao para
// ja preparar o copy/visual do prototipo, mas a opcao "EM GRUPO" e a lista
// de grupos ficam grayed-out com tag "em breve".
const GROUPS_ENABLED = false;

export function EducatorLearningModeView({ navigation, route }: Props) {
  const [mode, setMode] = useState<LearningMode>(null);

  const [assets] = useAssets([
    require('../../../assets/Logo-LETRAS.svg'),
    require('../../../assets/Person.svg'),
    require('../../../assets/Group.svg'),
  ]);

  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const personUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;
  const groupUri = assets?.[2]?.localUri ?? assets?.[2]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Educador';
  // Nome do alfabetizando contextual: vem do fluxo de vinculacao. Se ninguem
  // setou ainda (caso o usuario abriu a tela diretamente pelo botao "novo
  // alfabetizando"), usamos copy generico.
  const learnerName = route.params?.learnerName?.trim() || 'O alfabetizando';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
          <Text style={styles.questionText}>
            {learnerName} sera alfabetizando{"\n"}
            individualmente ou em um grupo?
          </Text>

          <Pressable
            style={[styles.modeOption, mode === 'individual' ? styles.modeOptionActive : null]}
            onPress={() => setMode('individual')}
          >
            {personUri ? (
              <SvgUri uri={personUri} width={58} height={48} />
            ) : (
              <ActivityIndicator size="small" color="#111111" />
            )}
            <Text style={styles.modeLabel}>INDIVIDUALMENTE</Text>
          </Pressable>

          <View
            style={[
              styles.modeOption,
              styles.modeOptionGroup,
              GROUPS_ENABLED ? null : styles.modeOptionDisabled,
            ]}
          >
            {groupUri ? (
              <SvgUri uri={groupUri} width={76} height={50} />
            ) : (
              <ActivityIndicator size="small" color="#111111" />
            )}
            <Text style={[styles.modeLabel, GROUPS_ENABLED ? null : styles.modeLabelDisabled]}>EM GRUPO</Text>
            {GROUPS_ENABLED ? null : (
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>EM BREVE</Text>
              </View>
            )}
          </View>

          <Text style={styles.helperText}>
            Por enquanto a alfabetizacao em grupo nao esta liberada. Siga com a opcao
            individual.
          </Text>
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
  questionText: {
    color: '#1a1a1a',
    fontSize: 30 / 1.6,
    lineHeight: 31,
    maxWidth: 320,
  },
  modeOption: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 4,
  },
  modeOptionGroup: {
    marginTop: 24,
  },
  modeOptionActive: {
    backgroundColor: '#e4e4e4',
  },
  modeOptionDisabled: {
    opacity: 0.35,
  },
  modeLabel: {
    marginTop: 8,
    color: '#111111',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  modeLabelDisabled: {
    color: '#5a5a5a',
  },
  soonBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9a9a9a',
    backgroundColor: '#f3f3f3',
  },
  soonBadgeText: {
    color: '#5a5a5a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  helperText: {
    marginTop: 22,
    color: '#5a5a5a',
    fontSize: 13,
    lineHeight: 19,
  },
});
