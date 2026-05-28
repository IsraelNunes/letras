import { useState } from 'react';
import { useAssets } from 'expo-asset';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri, SvgXml } from 'react-native-svg';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLearningMode'>;
type LearningMode = 'individual' | 'group' | null;

const ICON_PERSON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v1h20v-1c0-3.333-6.667-5-10-5z" fill="currentColor"/></svg>`;

const ICON_GROUP = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>`;

export function EducatorLearningModeView({ navigation, route }: Props) {
  const [mode, setMode] = useState<LearningMode>(null);
  const [newGroupName, setNewGroupName] = useState('');

  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Educador';
  const educatorId = route.params?.educatorId;
  const learnerName = route.params?.learnerName?.trim() || 'O alfabetizando';

  // Groups fetched from backend — stub until backend supports learner groups
  const groups: string[] = [];

  const goHome = () => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri ? (
              <SvgUri uri={logoUri} width={84} height={50} />
            ) : (
              <ActivityIndicator size="small" color="#111827" />
            )}
          </View>
          <Pressable style={styles.notificationButton} onPress={() => {}}>
            <Image source={require('../../../assets/notificacao.png')} style={styles.notificationIcon} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.questionText}>
            {learnerName} sera alfabetizado individualmente ou em um grupo?
          </Text>

          <Pressable
            style={[styles.modeOption, mode === 'individual' ? styles.modeOptionActive : null]}
            onPress={goHome}
          >
            <SvgXml xml={ICON_PERSON} width={48} height={48} color="#111111" />
            <Text style={styles.modeLabel}>INDIVIDUALMENTE</Text>
          </Pressable>

          <Pressable
            style={[styles.modeOption, styles.modeOptionGroup, mode === 'group' ? styles.modeOptionActive : null]}
            onPress={() => setMode('group')}
          >
            <SvgXml xml={ICON_GROUP} width={60} height={50} color="#111111" />
            <Text style={styles.modeLabel}>EM GRUPO</Text>
          </Pressable>

          {mode === 'group' && (
            <View style={styles.groupSection}>
              <Text style={styles.groupSectionTitle}>CRIAR NOVO GRUPO</Text>
              <View style={styles.groupInputRow}>
                <TextInput
                  style={styles.groupInput}
                  placeholder="Informe o nome do novo grupo:"
                  placeholderTextColor="#9a9a9a"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
                <Pressable style={styles.groupArrowButton} onPress={() => {}}>
                  <Text style={styles.groupArrowText}>{'→'}</Text>
                </Pressable>
              </View>

              <Text style={styles.groupOrText}>OU</Text>

              <Text style={styles.groupListTitle}>INCLUIR NO GRUPO:</Text>
              {groups.length === 0 ? (
                <Text style={styles.groupEmptyText}>Nenhum grupo criado ainda.</Text>
              ) : (
                groups.map((g, i) => (
                  <Pressable key={i} style={styles.groupItem} onPress={goHome}>
                    <Text style={styles.groupItemText}>{g}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onInicioPress={goHome}
        onTutorialPress={goHome}
        onAcompanharPress={goHome}
        onPontuacaoPress={goHome}
        onPerfilPress={() => navigation.navigate('EducatorProfile')}
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
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 130,
    backgroundColor: '#ededed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  notificationButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    right: 1,
    top: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  body: {
    marginTop: 28,
  },
  questionText: {
    color: '#1a1a1a',
    fontSize: 19,
    lineHeight: 27,
    maxWidth: 320,
  },
  modeOption: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modeOptionGroup: {
    marginTop: 20,
  },
  modeOptionActive: {
    backgroundColor: '#e4e4e4',
  },
  modeLabel: {
    marginTop: 8,
    color: '#111111',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  groupSection: {
    marginTop: 24,
    gap: 0,
  },
  groupSectionTitle: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  groupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1a1a1a',
  },
  groupArrowButton: {
    width: 40,
    height: 40,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupArrowText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  groupOrText: {
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: '#5a5a5a',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  groupListTitle: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  groupEmptyText: {
    color: '#9a9a9a',
    fontSize: 13,
    fontStyle: 'italic',
  },
  groupItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 6,
  },
  groupItemText: {
    color: '#1a1a1a',
    fontSize: 14,
  },
});
