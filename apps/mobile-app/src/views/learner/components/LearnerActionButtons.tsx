import { useAssets } from 'expo-asset';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { learnerTheme } from '../learnerTheme';

interface LearnerActionButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideBack?: boolean;
}

export function LearnerActionButtons({
  onBack,
  onNext,
  nextLabel = 'AVANCAR',
  backLabel = 'VOLTAR',
  hideBack = false,
}: LearnerActionButtonsProps) {
  const [assets] = useAssets([require('../../../../assets/voltar.svg'), require('../../../../assets/avancar.svg')]);
  const backUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const nextUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;

  return (
    <View style={styles.row}>
      {hideBack ? <View style={styles.placeholder} /> : (
        <Pressable style={styles.action} onPress={onBack} disabled={!onBack}>
          {backUri ? <SvgUri uri={backUri} width={58} height={42} /> : <ActivityIndicator size="small" color={learnerTheme.primary} />}
          <Text style={styles.label}>{backLabel}</Text>
        </Pressable>
      )}

      <Pressable style={styles.action} onPress={onNext} disabled={!onNext}>
        {nextUri ? <SvgUri uri={nextUri} width={58} height={42} /> : <ActivityIndicator size="small" color={learnerTheme.primary} />}
        <Text style={styles.label}>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  action: {
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholder: {
    width: 100,
  },
  label: {
    fontSize: 16,
    color: learnerTheme.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

