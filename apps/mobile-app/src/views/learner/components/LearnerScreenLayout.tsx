import { PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EducatorBottomMenu } from '../../educator/components/EducatorBottomMenu';
import { LearnerHeaderBar } from './LearnerHeaderBar';
import { learnerTheme } from '../learnerTheme';

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
  sessionErrorMessage,
}: LearnerScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
          <View style={styles.helpRow}>
            <Pressable style={styles.helpButton} onPress={onRequestHelp}>
              <Text style={styles.helpButtonText}>PEDIR AJUDA</Text>
            </Pressable>
            {helpAcknowledgedAt ? <Text style={styles.helpAckText}>Ajuda recebida</Text> : null}
          </View>
        ) : null}
        <View style={styles.body}>{children}</View>
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
});
