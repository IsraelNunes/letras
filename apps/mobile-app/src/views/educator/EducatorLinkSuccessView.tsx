import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAssets } from 'expo-asset';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { SvgUri, SvgXml } from 'react-native-svg';
import { EducatorRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLinkSuccess'>;

const ICON_SEGUIR = `<svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 20H56" stroke="#111111" stroke-width="3" stroke-linecap="round"/>
  <path d="M44 8L56 20L44 32" stroke="#111111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function EducatorLinkSuccessView({ navigation, route }: Props) {
  const { learnerName, educatorId, fullName } = route.params;

  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const handleSeguir = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'EducatorHome', params: { educatorId, fullName } }],
    });
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
          <Text style={styles.message}>
            Vinculação confirmada. Você já pode seguir para a etapa 2 da alfabetização de{' '}
            <Text style={styles.messageBold}>{learnerName}</Text>.
          </Text>
        </View>

        <Pressable style={styles.seguirButton} onPress={handleSeguir}>
          <SvgXml xml={ICON_SEGUIR} width={64} height={40} />
          <Text style={styles.seguirLabel}>SEGUIR</Text>
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
    backgroundColor: '#ededed',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  message: {
    fontSize: 18,
    lineHeight: 28,
    color: '#141414',
    fontWeight: '400',
  },
  messageBold: {
    fontWeight: '700',
  },
  seguirButton: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  seguirLabel: {
    fontSize: 17,
    lineHeight: 21,
    color: '#101010',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
});
