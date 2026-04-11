import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { EducatorBottomMenu } from '../../educator/components/EducatorBottomMenu';
import { LearnerHeaderBar } from './LearnerHeaderBar';

type MenuKey = 'inicio' | 'tutorial' | 'acompanhar' | 'pontuacao' | 'perfil';

interface LearnerScreenLayoutProps extends PropsWithChildren {
  activeMenu?: MenuKey;
  onMenuHome?: () => void;
  onMenuTutorial?: () => void;
  onMenuTrack?: () => void;
  onMenuScore?: () => void;
  onMenuProfile?: () => void;
  roleLabel?: string;
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
}: LearnerScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LearnerHeaderBar roleLabel={roleLabel} />
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
    backgroundColor: '#ededed',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#ededed',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 130,
  },
  body: {
    marginTop: 14,
  },
});
