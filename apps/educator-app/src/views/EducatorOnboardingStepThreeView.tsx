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

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorOnboardingStepThree'>;

const EDUCATION_LEVELS = [
  'Fundamental incompleto',
  'Fundamental completo',
  'Medio incompleto',
  'Medio completo',
  'Superior incompleto',
  'Superior completo',
  'Pos-graduacao',
  'Mestrado',
  'Doutorado',
] as const;

export function EducatorOnboardingStepThreeView({ navigation, route }: Props) {
  const [educationLevel, setEducationLevel] = useState('');
  const [isEducationSelectOpen, setIsEducationSelectOpen] = useState(false);
  const [trainingArea, setTrainingArea] = useState('');

  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [xHandle, setXHandle] = useState('');

  const [assets] = useAssets([
    require('../../assets/Logo-LETRAS.svg'),
    require('../../assets/avançar.svg'),
  ]);

  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const forwardUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;

  const isEducationValid = useMemo(
    () => EDUCATION_LEVELS.includes(educationLevel as (typeof EDUCATION_LEVELS)[number]),
    [educationLevel],
  );
  const isTrainingAreaValid = useMemo(() => trainingArea.trim().length >= 2, [trainingArea]);
  const canProceed = isEducationValid && isTrainingAreaValid;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
          <Text style={styles.label}>Grau de Escolaridade</Text>
          <Pressable
            style={[styles.selectField, educationLevel.length > 0 && !isEducationValid ? styles.inputInvalid : null]}
            onPress={() => setIsEducationSelectOpen((prev) => !prev)}
          >
            <Text style={[styles.selectText, !educationLevel ? styles.placeholderText : null]}>
              {educationLevel || 'Selecione'}
            </Text>
            <Text style={styles.arrow}>{isEducationSelectOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isEducationSelectOpen ? (
            <View style={styles.selectList}>
              <ScrollView nestedScrollEnabled style={styles.selectListScroll}>
                {EDUCATION_LEVELS.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.selectItem}
                    onPress={() => {
                      setEducationLevel(item);
                      setIsEducationSelectOpen(false);
                    }}
                  >
                    <Text style={styles.selectItemText}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.label}>Area de Formacao</Text>
          <TextInput
            value={trainingArea}
            onChangeText={setTrainingArea}
            style={[styles.input, trainingArea.length > 0 && !isTrainingAreaValid ? styles.inputInvalid : null]}
            placeholder=""
            placeholderTextColor="#8f8f8f"
          />

          <Text style={styles.infoText}>
            Informe suas redes sociais. Voce podera divulgar as conquistas de seus alfabetizandos.
          </Text>

          <View style={styles.socialRow}>
            <View style={styles.socialIcon}><Text style={styles.socialIconText}>in</Text></View>
            <TextInput value={linkedin} onChangeText={setLinkedin} style={styles.socialInput} />
          </View>

          <View style={styles.socialRow}>
            <View style={styles.socialIcon}><Text style={styles.socialIconText}>f</Text></View>
            <TextInput value={facebook} onChangeText={setFacebook} style={styles.socialInput} />
          </View>

          <View style={styles.socialRow}>
            <View style={styles.socialIcon}><Text style={styles.socialIconText}>ig</Text></View>
            <TextInput value={instagram} onChangeText={setInstagram} style={styles.socialInput} />
          </View>

          <View style={styles.socialRow}>
            <View style={styles.socialIcon}><Text style={styles.socialIconText}>x</Text></View>
            <TextInput value={xHandle} onChangeText={setXHandle} style={styles.socialInput} />
          </View>
        </View>

        <Pressable
          style={[styles.advanceButton, !canProceed ? styles.advanceButtonDisabled : null]}
          disabled={!canProceed}
          onPress={() =>
            navigation.navigate('EducatorOnboardingConfirm', {
              cpf: route.params.cpf,
              phoneDigits: route.params.phoneDigits,
              fullName: route.params.fullName,
              birthDate: route.params.birthDate,
              uf: route.params.uf,
              city: route.params.city,
              photoUri: route.params.photoUri,
              educationLevel,
              trainingArea: trainingArea.trim(),
              linkedin: linkedin.trim(),
              facebook: facebook.trim(),
              instagram: instagram.trim(),
              xHandle: xHandle.trim(),
            })
          }
        >
          {forwardUri ? (
            <SvgUri uri={forwardUri} width={64} height={40} />
          ) : (
            <ActivityIndicator size="small" color="#20385f" />
          )}
          <Text style={styles.advanceLabel}>AVANCAR</Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: 52,
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
    marginTop: 34,
    gap: 10,
  },
  label: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    color: '#141414',
    fontWeight: '500',
  },
  selectField: {
    height: 38,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  selectText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: '#6b7280',
  },
  arrow: {
    color: '#8d8d8d',
    fontSize: 12,
    marginLeft: 8,
  },
  selectList: {
    borderWidth: 1,
    borderColor: '#d6d6d6',
    backgroundColor: '#f3f3f3',
    borderRadius: 4,
    maxHeight: 220,
  },
  selectListScroll: {
    maxHeight: 220,
  },
  selectItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e7e7',
  },
  selectItemText: {
    color: '#0f172a',
    fontSize: 14,
  },
  input: {
    height: 38,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 12,
    color: '#111111',
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    marginTop: 10,
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  socialRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  socialInput: {
    flex: 1,
    height: 32,
    borderRadius: 1,
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 10,
    color: '#111111',
    fontSize: 14,
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: '#b91c1c',
  },
  advanceButton: {
    marginTop: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  advanceButtonDisabled: {
    opacity: 0.35,
  },
  advanceLabel: {
    fontSize: 17,
    lineHeight: 21,
    color: '#101010',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
});
