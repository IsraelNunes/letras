import { useEffect } from 'react';
import { useAssets } from 'expo-asset';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { EducatorRootStackParamList } from '../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLoading'>;

const LOADING_DURATION_MS = 1800;

export function EducatorLoadingView({ navigation }: Props) {
  const [assets] = useAssets([require('../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('EducatorLogin');
    }, LOADING_DURATION_MS);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {logoUri ? (
        <>
          <SvgUri uri={logoUri} width={220} height={128} />
          <Text style={styles.subtitle}>Educador</Text>
        </>
      ) : (
        <ActivityIndicator size="small" color="#111827" />
      )}
      <EducatorBottomMenu active="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ededed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: 0.4,
  },
});
