import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface LearnerActionButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideBack?: boolean;
}

const NEXT_ARROW = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 17H30V8L51 23L30 38V29H4V17Z" stroke="#8fd17e" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const BACK_ARROW = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M51 17H25V8L4 23L25 38V29H51V17Z" stroke="#8fd17e" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

export function LearnerActionButtons({
  onBack,
  onNext,
  nextLabel = 'avançar',
  backLabel = 'voltar',
  hideBack = false,
}: LearnerActionButtonsProps) {
  return (
    <View style={styles.row}>
      {hideBack ? (
        <View style={styles.placeholder} />
      ) : (
        <Pressable style={styles.action} onPress={onBack} disabled={!onBack}>
          <SvgXml xml={BACK_ARROW} width={55} height={46} />
          <Text style={styles.label}>{backLabel}</Text>
        </Pressable>
      )}

      <Pressable style={styles.action} onPress={onNext} disabled={!onNext}>
        <SvgXml xml={NEXT_ARROW} width={55} height={46} />
        <Text style={styles.label}>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  action: {
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  placeholder: {
    width: 86,
  },
  label: {
    fontSize: 10,
    color: '#8fd17e',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
});
