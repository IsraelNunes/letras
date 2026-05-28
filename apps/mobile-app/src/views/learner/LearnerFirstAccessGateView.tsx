import { useAssets } from 'expo-asset';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { LearnerRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerFirstAccessGate'>;

export function LearnerFirstAccessGateView({ navigation }: Props) {
  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

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
          <Text style={styles.question}>É o seu primeiro acesso?</Text>

          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.navigate('LearnerLinkStep1')}
          >
            <Text style={[styles.buttonLabel, styles.buttonLabelPrimary]}>SIM</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.navigate('LearnerCpfLogin')}
          >
            <Text style={[styles.buttonLabel, styles.buttonLabelSecondary]}>NÃO</Text>
          </Pressable>
        </View>
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
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 60,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#141414',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: 200,
    height: 52,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#20385f',
  },
  buttonSecondary: {
    backgroundColor: '#e4e4e4',
    borderWidth: 1,
    borderColor: '#c0c0c0',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonLabelPrimary: {
    color: '#ffffff',
  },
  buttonLabelSecondary: {
    color: '#20385f',
  },
});
