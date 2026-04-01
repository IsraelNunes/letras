import { useMemo, useState } from 'react';
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
import { SvgUri } from 'react-native-svg';
import { EducatorRootStackParamList } from '../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLearningMode'>;
type LearningMode = 'individual' | 'group' | null;

const DEFAULT_GROUPS = [
  'Grupo de Alfabetizandos 3',
  'Grupo de Alfabetizandos 4',
  'Grupo de Alfabetizandos 5',
] as const;

export function EducatorLearningModeView({ navigation, route }: Props) {
  const [mode, setMode] = useState<LearningMode>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([...DEFAULT_GROUPS]);

  const [assets] = useAssets([
    require('../../assets/Logo-LETRAS.svg'),
    require('../../assets/Person.svg'),
    require('../../assets/Group.svg'),
    require('../../assets/avançar.svg'),
  ]);

  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const personUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;
  const groupUri = assets?.[2]?.localUri ?? assets?.[2]?.uri;
  const arrowUri = assets?.[3]?.localUri ?? assets?.[3]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Educador';

  const normalizedNewGroupName = newGroupName.trim();
  const canCreateGroup = normalizedNewGroupName.length >= 2;

  const repeatedGroupName = useMemo(
    () => groups.some((item) => item.toLocaleLowerCase('pt-BR') === normalizedNewGroupName.toLocaleLowerCase('pt-BR')),
    [groups, normalizedNewGroupName],
  );

  const handleCreateGroup = () => {
    if (!canCreateGroup || repeatedGroupName) return;

    setGroups((prev) => [normalizedNewGroupName, ...prev]);
    setSelectedGroupName(normalizedNewGroupName);
    setMode('group');
    setNewGroupName('');
  };

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
            <Image source={require('../../assets/notificacao.png')} style={styles.notificationIcon} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.questionText}>
            {educatorName} sera alfabetizando{"\n"}
            individualmente ou em um grupo?
          </Text>

          <Pressable
            style={[styles.modeOption, mode === 'individual' ? styles.modeOptionActive : null]}
            onPress={() => {
              setMode('individual');
              setSelectedGroupName(null);
            }}
          >
            {personUri ? (
              <SvgUri uri={personUri} width={58} height={48} />
            ) : (
              <ActivityIndicator size="small" color="#111111" />
            )}
            <Text style={styles.modeLabel}>INDIVIDUALMENTE</Text>
          </Pressable>

          <Pressable
            style={[styles.modeOption, styles.modeOptionGroup, mode === 'group' ? styles.modeOptionActive : null]}
            onPress={() => setMode('group')}
          >
            {groupUri ? (
              <SvgUri uri={groupUri} width={76} height={50} />
            ) : (
              <ActivityIndicator size="small" color="#111111" />
            )}
            <Text style={styles.modeLabel}>EM GRUPO</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>CRIAR NOVO GRUPO</Text>
          <Text style={styles.sectionLabel}>Informe o nome do novo grupo:</Text>

          <View style={styles.inlineInputRow}>
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              style={styles.groupInput}
              placeholder=""
              placeholderTextColor="#8f8f8f"
            />
            <Pressable
              style={[styles.arrowButton, !canCreateGroup || repeatedGroupName ? styles.arrowButtonDisabled : null]}
              onPress={handleCreateGroup}
              disabled={!canCreateGroup || repeatedGroupName}
            >
              {arrowUri ? (
                <SvgUri uri={arrowUri} width={34} height={26} />
              ) : (
                <ActivityIndicator size="small" color="#20385f" />
              )}
            </Pressable>
          </View>

          <Text style={styles.ouText}>OU</Text>

          <Text style={styles.sectionTitle}>INCLUIR NO GRUPO:</Text>
          {groups.map((item) => (
            <Pressable
              key={item}
              style={[styles.groupItem, selectedGroupName === item ? styles.groupItemSelected : null]}
              onPress={() => {
                setMode('group');
                setSelectedGroupName(item);
              }}
            >
              <Text style={styles.groupItemText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onInicioPress={() => navigation.navigate('EducatorLearningMode', { fullName: educatorName })}
        onTutorialPress={() => navigation.navigate('EducatorSplash')}
        onAcompanharPress={() => navigation.navigate('EducatorLearningMode', { fullName: educatorName })}
        onPontuacaoPress={() => navigation.navigate('EducatorLearningMode', { fullName: educatorName })}
        onPerfilPress={() => navigation.navigate('EducatorLogin')}
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
    fontSize: 30 / 1.6,
    lineHeight: 31,
    maxWidth: 320,
  },
  modeOption: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 4,
  },
  modeOptionGroup: {
    marginTop: 24,
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
  sectionTitle: {
    marginTop: 18,
    color: '#111111',
    fontSize: 21 / 1.2,
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: 7,
    color: '#242424',
    fontSize: 15,
  },
  inlineInputRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupInput: {
    flex: 1,
    height: 30,
    borderRadius: 1,
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 9,
    color: '#111111',
    fontSize: 14,
  },
  arrowButton: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.4,
  },
  ouText: {
    marginTop: 22,
    color: '#242424',
    fontSize: 16,
  },
  groupItem: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  groupItemSelected: {
    backgroundColor: '#e4e4e4',
  },
  groupItemText: {
    color: '#1a1a1a',
    fontSize: 17 / 1.2,
  },
});
