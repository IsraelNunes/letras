import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface LearnerActionButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideBack?: boolean;
  // 'green' (padrão) = setas de exercício com destravamento progressivo (RN106/107).
  // 'dark' = setas de navegação (VOLTAR/AVANÇAR) das telas de abertura, contorno
  // escuro navy, labels em maiúsculas — fiel ao Figma (Etapa - Tela de Abertura).
  variant?: 'green' | 'dark';
}

const NEXT_ARROW_DARK = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 17H30V8L51 23L30 38V29H4V17Z" stroke="#101a3d" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const BACK_ARROW_DARK = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M51 17H25V8L4 23L25 38V29H51V17Z" stroke="#101a3d" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

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
  variant = 'green',
}: LearnerActionButtonsProps) {
  const backDisabled = !onBack;
  const nextDisabled = !onNext;
  const dark = variant === 'dark';
  const backXml = dark ? BACK_ARROW_DARK : backDisabled ? BACK_ARROW_DISABLED : BACK_ARROW_ACTIVE;
  const nextXml = dark ? NEXT_ARROW_DARK : nextDisabled ? NEXT_ARROW_DISABLED : NEXT_ARROW_ACTIVE;
  const labelStyle = dark ? [styles.label, styles.labelDark] : styles.label;

  return (
    <View style={styles.row}>
      {hideBack ? (
        <View style={styles.placeholder} />
      ) : (
        <Pressable style={styles.action} onPress={onBack} disabled={backDisabled}>
          <SvgXml xml={backXml} width={55} height={46} />
          {backLabel ? <Text style={labelStyle}>{backLabel}</Text> : null}
        </Pressable>
      )}

      <Pressable style={styles.action} onPress={onNext} disabled={nextDisabled}>
        <SvgXml xml={nextXml} width={55} height={46} />
        {nextLabel ? <Text style={labelStyle}>{nextLabel}</Text> : null}
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
  labelDark: {
    color: '#101a3d',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
