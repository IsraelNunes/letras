import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface LearnerActionButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideBack?: boolean;
}

// Setas com dois estados: ativa (verde escuro, pronta para uso) e
// "apagada" (cinza claro, indica indisponivel). Sem texto: o publico
// alfabetizando ainda nao le, entao a unica sinalizacao de
// disponibilidade e o tom da seta.
const NEXT_ARROW_ACTIVE = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 17H30V8L51 23L30 38V29H4V17Z" stroke="#2fa536" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const NEXT_ARROW_DISABLED = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 17H30V8L51 23L30 38V29H4V17Z" stroke="#9be39f" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const BACK_ARROW_ACTIVE = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M51 17H25V8L4 23L25 38V29H51V17Z" stroke="#2fa536" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const BACK_ARROW_DISABLED = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M51 17H25V8L4 23L25 38V29H51V17Z" stroke="#9be39f" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

export function LearnerActionButtons({
  onBack,
  onNext,
  nextLabel,
  backLabel,
  hideBack = false,
}: LearnerActionButtonsProps) {
  const backDisabled = !onBack;
  const nextDisabled = !onNext;

  return (
    <View style={styles.row}>
      {hideBack ? (
        <View style={styles.placeholder} />
      ) : (
        <Pressable style={styles.action} onPress={onBack} disabled={backDisabled}>
          <SvgXml xml={backDisabled ? BACK_ARROW_DISABLED : BACK_ARROW_ACTIVE} width={55} height={46} />
          {backLabel ? <Text style={styles.label}>{backLabel}</Text> : null}
        </Pressable>
      )}

      <Pressable style={styles.action} onPress={onNext} disabled={nextDisabled}>
        <SvgXml xml={nextDisabled ? NEXT_ARROW_DISABLED : NEXT_ARROW_ACTIVE} width={55} height={46} />
        {nextLabel ? <Text style={styles.label}>{nextLabel}</Text> : null}
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
    color: '#2fa536',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
});
