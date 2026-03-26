import { ReferenceCity, ReferenceUf } from '@letras/shared-types';
import { useAssets } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { EducatorRepositoryImpl } from '../data/repositories/educator-repository.impl';
import { EducatorRootStackParamList } from '../types';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorOnboardingStepTwo'>;

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function maskDate(value: string) {
  const digits = normalizeDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidDate(value: string) {
  const parts = value.split('/');
  if (parts.length !== 3) return false;
  if (parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) return false;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (year < 1900) return false;
  if (month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false;
  }

  return date <= new Date();
}

export function EducatorOnboardingStepTwoView({ navigation }: Props) {
  const repository = useMemo(() => new EducatorRepositoryImpl(), []);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [uf, setUf] = useState('');
  const [city, setCity] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [ufs, setUfs] = useState<ReferenceUf[]>([]);
  const [cities, setCities] = useState<ReferenceCity[]>([]);
  const [isLoadingUfs, setIsLoadingUfs] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  const [assets] = useAssets([
    require('../../assets/Logo-LETRAS.svg'),
    require('../../assets/avançar.svg'),
  ]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const forwardUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;

  useEffect(() => {
    let isMounted = true;

    const loadUfs = async () => {
      try {
        setIsLoadingUfs(true);
        setReferenceError(null);
        const fetchedUfs = await repository.fetchUfs();
        if (isMounted) {
          setUfs(fetchedUfs);
        }
      } catch (error) {
        if (isMounted) {
          setReferenceError(error instanceof Error ? error.message : 'Erro ao carregar UFs.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingUfs(false);
        }
      }
    };

    void loadUfs();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const isUfValid = useMemo(() => ufs.some((item) => item.code === uf), [ufs, uf]);

  useEffect(() => {
    let isMounted = true;

    const loadCities = async () => {
      if (!isUfValid) {
        setCities([]);
        return;
      }

      try {
        setIsLoadingCities(true);
        setReferenceError(null);
        const fetchedCities = await repository.fetchCitiesByUf(uf);
        if (isMounted) {
          setCities(fetchedCities);
        }
      } catch (error) {
        if (isMounted) {
          setReferenceError(error instanceof Error ? error.message : 'Erro ao carregar cidades.');
          setCities([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    };

    void loadCities();

    return () => {
      isMounted = false;
    };
  }, [isUfValid, repository, uf]);

  const filteredCities = useMemo(() => {
    if (!isUfValid) return [];

    const query = normalizeText(city);
    if (!query) return cities.slice(0, 8);

    return cities.filter((item) => normalizeText(item.name).includes(query)).slice(0, 8);
  }, [cities, city, isUfValid]);

  const isFullNameValid = useMemo(() => fullName.trim().split(/\s+/).length >= 2, [fullName]);
  const isBirthDateValid = useMemo(() => isValidDate(birthDate), [birthDate]);
  const isCityValid = useMemo(() => {
    if (!isUfValid) return false;
    const normalized = normalizeText(city);
    if (!normalized) return false;
    return cities.some((item) => normalizeText(item.name) === normalized);
  }, [cities, city, isUfValid]);

  const hasPhoto = Boolean(photoUri);
  const canProceed = isFullNameValid && isBirthDateValid && isUfValid && isCityValid && hasPhoto;

  const pickImageFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Precisamos da permissao para acessar sua galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Precisamos da permissao da camera para tirar a foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const openPhotoChooser = () => {
    Alert.alert('Foto do educador', 'Escolha como deseja adicionar a foto.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Upload', onPress: () => void pickImageFromGallery() },
      { text: 'Tirar foto', onPress: () => void takePhoto() },
    ]);
  };

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
          <Text style={styles.label}>Nome completo: *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={[styles.input, fullName.length > 0 && !isFullNameValid ? styles.inputInvalid : null]}
            placeholder=""
            placeholderTextColor="#8f8f8f"
          />

          <Text style={styles.label}>Data de Nascimento: *</Text>
          <TextInput
            value={birthDate}
            onChangeText={(text) => setBirthDate(maskDate(text))}
            style={[styles.dateInput, birthDate.length > 0 && !isBirthDateValid ? styles.inputInvalid : null]}
            keyboardType="number-pad"
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#7a7a7a"
          />

          <Text style={styles.label}>UF *</Text>
          <View style={styles.ufRow}>
            <TextInput
              value={uf}
              onChangeText={(text) => {
                const nextUf = text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                setUf(nextUf);
                setCity('');
              }}
              style={[styles.ufInput, uf.length > 0 && !isUfValid ? styles.inputInvalid : null]}
              placeholder="UF"
              placeholderTextColor="#7a7a7a"
              autoCapitalize="characters"
              maxLength={2}
            />
            <Text style={styles.ufArrow}>▼</Text>
          </View>

          {isLoadingUfs ? <Text style={styles.helperText}>Carregando UFs...</Text> : null}

          <Text style={styles.label}>Cidade: *</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            style={[styles.input, city.length > 0 && !isCityValid ? styles.inputInvalid : null]}
            placeholder={isUfValid ? 'Digite a cidade' : 'Selecione uma UF primeiro'}
            placeholderTextColor="#8f8f8f"
            editable={isUfValid && !isLoadingCities}
          />

          {isLoadingCities ? <Text style={styles.helperText}>Carregando cidades...</Text> : null}

          {!isLoadingCities && isUfValid && filteredCities.length > 0 ? (
            <View style={styles.cityList}>
              {filteredCities.map((item) => (
                <Pressable key={item.id} style={styles.cityListItem} onPress={() => setCity(item.name)}>
                  <Text style={styles.cityListItemText}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {referenceError ? <Text style={styles.errorText}>{referenceError}</Text> : null}

          <Text style={styles.photoLabel}>Faca o upload ou tire uma foto sua.</Text>

          <Pressable style={[styles.photoBox, hasPhoto ? styles.photoBoxSelected : null]} onPress={openPhotoChooser}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoPlaceholder}>Adicionar foto</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={[styles.advanceButton, !canProceed ? styles.advanceButtonDisabled : null]}
          disabled={!canProceed}
          onPress={() => navigation.replace('EducatorDashboard')}
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
    paddingBottom: 50,
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
    marginTop: 30,
    gap: 10,
  },
  label: {
    marginTop: 4,
    fontSize: 22 / 1.4,
    lineHeight: 22,
    color: '#141414',
    maxWidth: 320,
    fontWeight: '500',
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
  dateInput: {
    width: 132,
    height: 40,
    marginTop: 4,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    color: '#111111',
    fontSize: 15,
    fontWeight: '500',
    textAlignVertical: 'center',
  },
  ufRow: {
    width: 70,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  ufInput: {
    flex: 1,
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  ufArrow: {
    fontSize: 12,
    color: '#8d8d8d',
    marginLeft: 6,
  },
  helperText: {
    color: '#475569',
    fontSize: 12,
    marginTop: -4,
  },
  cityList: {
    backgroundColor: '#f3f3f3',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dddddd',
    maxHeight: 180,
  },
  cityListItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e7e7',
  },
  cityListItemText: {
    color: '#0f172a',
    fontSize: 14,
  },
  photoLabel: {
    marginTop: 6,
    fontSize: 16,
    color: '#141414',
    fontWeight: '400',
  },
  photoBox: {
    width: 92,
    height: 92,
    borderRadius: 2,
    backgroundColor: '#e4e4e4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBoxSelected: {
    borderWidth: 1,
    borderColor: '#1d4a8c',
  },
  photoPlaceholder: {
    color: '#4b5563',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: '#b91c1c',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: -2,
  },
  advanceButton: {
    marginTop: 40,
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
