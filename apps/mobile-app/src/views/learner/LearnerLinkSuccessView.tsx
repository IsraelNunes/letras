import { useAssets } from 'expo-asset';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { SessionStorage } from '../../infra/storage/session-storage';
import { LearnerRootStackParamList } from '../../types';
import { useOptionalLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLinkSuccess'>;

export function LearnerLinkSuccessView({ navigation, route }: Props) {
  const { learnerId, learnerName, educatorName } = route.params;
  const session = useOptionalLearnerSession();
  const [isSaving, setIsSaving] = useState(false);

  const [assets] = useAssets([
    require('../../../assets/Logo-LETRAS.svg'),
    require('../../../assets/avançar.svg'),
  ]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const forwardUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;

  const handleIniciar = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await SessionStorage.setLearnerProfileId(learnerId);
      if (session) await session.initialize();
      navigation.reset({ index: 0, routes: [{ name: 'LearnerHome' }] });
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar. Tente novamente.');
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          {logoUri ? (
            <SvgUri uri={logoUri} width={84} height={50} />
          ) : (
            <ActivityIndicator size="small" color="#111827" />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.successTitle}>Vinculação realizada com sucesso.</Text>

          <Text style={styles.paragraph}>
            O alfabetizando{' '}
            <Text style={styles.bold}>{learnerName}</Text>
            {' '}está vinculado ao{'\n'}alfabetizador{' '}
            <Text style={styles.bold}>{educatorName}</Text>
          </Text>

          <Text style={styles.attention}>
            ATENÇÃO: esta é a última tela gerenciada por você no celular do alfabetizando.{'\n'}
            A partir de agora, você deve auxiliar o alfabetizando à distância, sempre o
            acompanhando pelo seu celular.
          </Text>
        </View>

        <Pressable
          style={[styles.startButton, isSaving ? styles.startButtonDisabled : null]}
          disabled={isSaving}
          onPress={() => void handleIniciar()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#20385f" />
          ) : forwardUri ? (
            <SvgUri uri={forwardUri} width={64} height={40} />
          ) : (
            <ActivityIndicator size="small" color="#20385f" />
          )}
          <Text style={styles.startLabel}>INICIAR{'\n'}ALFABETIZAÇÃO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ededed',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 60,
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  body: {
    marginTop: 40,
    gap: 20,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#141414',
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#141414',
  },
  bold: {
    fontWeight: '700',
  },
  attention: {
    fontSize: 14,
    lineHeight: 22,
    color: '#141414',
  },
  startButton: {
    marginTop: 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startLabel: {
    fontSize: 17,
    lineHeight: 21,
    color: '#101010',
    letterSpacing: 0.4,
    fontWeight: '600',
    textAlign: 'center',
  },
});
