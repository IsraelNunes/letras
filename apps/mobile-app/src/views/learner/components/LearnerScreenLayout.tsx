import { PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { EducatorBottomMenu } from '../../educator/components/EducatorBottomMenu';
import { LearnerHeaderBar } from './LearnerHeaderBar';
import { learnerTheme } from '../learnerTheme';

// Cruz grande sobreposta ao banner AGUARDANDO AJUDA. Segue o desenho do
// Figma "Etapas 2 e 3 - Tela bloqueada": dois tracos diagonais brancos.
function PendingCrossIcon() {
  return (
    <Svg width={42} height={42} viewBox="0 0 42 42" fill="none">
      <Path d="M6 6 L36 36" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
      <Path d="M36 6 L6 36" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}

// Telefone com bolha de fala simplificado, tambem do Figma. O traco e
// branco, igual ao texto, mantendo o contraste com o fundo vermelho.
function PendingPhoneIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 9 C6 7 7 6 9 6 L11 6 C12 6 13 7 13 8 L13 11 C13 12 12 13 11 13 L10 13 C10 17 13 20 17 20 L17 19 C17 18 18 17 19 17 L22 17 C23 17 24 18 24 19 L24 21 C24 23 23 24 21 24 C12 24 6 18 6 9 Z"
        fill="#ffffff"
      />
      <Path
        d="M18 5 C23 5 27 9 27 14"
        stroke="#ffffff"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type MenuKey = 'inicio' | 'tutorial' | 'acompanhar' | 'pontuacao' | 'perfil';

interface LearnerScreenLayoutProps extends PropsWithChildren {
  activeMenu?: MenuKey;
  onMenuHome?: () => void;
  onMenuTutorial?: () => void;
  onMenuTrack?: () => void;
  onMenuScore?: () => void;
  onMenuProfile?: () => void;
  roleLabel?: string;
  isSessionLocked?: boolean;
  onRequestHelp?: () => void;
  helpAcknowledgedAt?: string | null;
  isHelpPending?: boolean;
  sessionErrorMessage?: string | null;
}

export function LearnerScreenLayout({
  children,
  activeMenu = 'acompanhar',
  onMenuHome,
  onMenuTutorial,
  onMenuTrack,
  onMenuScore,
  onMenuProfile,
  roleLabel,
  isSessionLocked = false,
  onRequestHelp,
  helpAcknowledgedAt,
  isHelpPending = false,
  sessionErrorMessage,
}: LearnerScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.shell}>
          <LearnerHeaderBar roleLabel={roleLabel} />
          {sessionErrorMessage ? (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{sessionErrorMessage}</Text>
            </View>
          ) : null}
          {isSessionLocked ? (
            <View style={styles.alertLock}>
              <Text style={styles.alertLockText}>Sessao bloqueada pelo alfabetizador. Aguarde orientacao.</Text>
            </View>
          ) : null}
          {onRequestHelp ? (
            isHelpPending ? (
              // Estado "tela bloqueada aguardando apoio". Banner grande
              // vermelho com texto + X + telefone, ocupando a largura toda
              // (Figma: Etapas 2 e 3 - Tela bloqueada).
              <View style={styles.pendingBanner}>
                <Text style={styles.pendingBannerText}>
                  AGUARDANDO{"\n"}AJUDA
                </Text>
                <View style={styles.pendingBannerIcons}>
                  <PendingCrossIcon />
                  <PendingPhoneIcon />
                </View>
              </View>
            ) : (
              <View style={styles.helpRow}>
                <Pressable style={styles.helpButton} onPress={onRequestHelp}>
                  <Text style={styles.helpButtonText}>PEDIR AJUDA</Text>
                </Pressable>
                {helpAcknowledgedAt ? (
                  <Text style={styles.helpAckText}>Ajuda recebida</Text>
                ) : null}
              </View>
            )
          ) : null}
          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>
      <EducatorBottomMenu
        active={activeMenu}
        onInicioPress={onMenuHome}
        onTutorialPress={onMenuTutorial}
        onAcompanharPress={onMenuTrack}
        onPontuacaoPress={onMenuScore}
        onPerfilPress={onMenuProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: learnerTheme.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: learnerTheme.background,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 130,
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    maxWidth: 390,
  },
  body: {
    marginTop: 14,
  },
  alertError: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f7b3b3',
    backgroundColor: '#fff1f1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertErrorText: {
    color: '#8c1d1d',
    fontSize: 12,
  },
  alertLock: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f2c387',
    backgroundColor: '#fff7ea',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertLockText: {
    color: '#7d4b07',
    fontSize: 12,
    fontWeight: '600',
  },
  helpRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helpButton: {
    borderWidth: 1,
    borderColor: learnerTheme.primary,
    backgroundColor: learnerTheme.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  helpButtonText: {
    color: learnerTheme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  helpAckText: {
    color: '#2f6a2f',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBanner: {
    marginTop: 12,
    backgroundColor: '#e11d2c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pendingBannerText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: 21,
    flexShrink: 1,
  },
  pendingBannerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
