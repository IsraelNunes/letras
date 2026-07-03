import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LearnerRootStackParamList } from '../../types';
import { httpClient } from '../../infra/api/http-client';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { useLearnerSession } from './learnerSessionContext';
import { playErrorBeep, playSuccessBeep } from './exerciseSounds';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerPhotoReview'>;

// Figma "Etapas 2 e 3 - Foto do exercício": foto grande, FAZER OUTRA FOTO e
// ENVIAR FOTO em verde. O público não lê com fluência — ícones carregam a ação.
const CAMERA_RETRY = `
<svg width="50" height="42" viewBox="0 0 50 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 7L20.5 2H29.5L33 7H43C45.2 7 47 8.8 47 11V36C47 38.2 45.2 40 43 40H7C4.8 40 3 38.2 3 36V11C3 8.8 4.8 7 7 7H17Z" fill="#2fa536"/>
  <circle cx="25" cy="23" r="8.5" fill="#ffffff"/>
  <circle cx="25" cy="23" r="4.8" fill="#2fa536"/>
</svg>`;

const CAMERA_SEND = `
<svg width="62" height="42" viewBox="0 0 62 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 9L14.6 5H21.4L24 9H31C32.7 9 34 10.3 34 12V32C34 33.7 32.7 35 31 35H5C3.3 35 2 33.7 2 32V12C2 10.3 3.3 9 5 9H12Z" fill="#2fa536"/>
  <circle cx="18" cy="22" r="6.2" fill="#ffffff"/>
  <circle cx="18" cy="22" r="3.4" fill="#2fa536"/>
  <path d="M38 18H50V12L60 22L50 32V26H38V18Z" fill="#2fa536"/>
</svg>`;

async function buildPhotoFormData(photoUri: string, learnerProfileId: string) {
  const formData = new FormData();
  formData.append('learnerProfileId', learnerProfileId);
  const fileName = `foto-${Date.now()}.jpg`;
  if (Platform.OS === 'web') {
    // Na web o uri é blob/data URL — o FormData precisa de um Blob real.
    const blob = await fetch(photoUri).then((response) => response.blob());
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', { uri: photoUri, name: fileName, type: 'image/jpeg' } as any);
  }
  return formData;
}

export function LearnerPhotoReviewView({ navigation, route }: Props) {
  const { activityId, kind = 'atividade' } = route.params;
  const learnerSession = useLearnerSession();
  const [photoUri, setPhotoUri] = useState(route.params.photoUri);
  const [isSending, setIsSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCarta = kind === 'carta';

  // RN114: "FAZER OUTRA FOTO" repete a captura (RN113/RN011).
  const retakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Precisamos da permissao da camera para fotografar.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setErrorMessage(null);
    }
  };

  // MVP sem IA (decisão 17/05 §4): o envio registra a foto e avisa o
  // alfabetizador; a avaliação é manual dele (APROVAR TAREFA, RN081).
  const sendPhoto = async () => {
    if (!learnerSession.learnerProfileId || isSending) {
      return;
    }
    try {
      setIsSending(true);
      setErrorMessage(null);
      const formData = await buildPhotoFormData(photoUri, learnerSession.learnerProfileId);
      await httpClient.postFormData(
        `/painel/atividades/${isCarta ? 'carta' : activityId ?? 'carta'}/foto`,
        formData,
      );
      playSuccessBeep();
      setSentOk(true);
    } catch (error) {
      playErrorBeep();
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar a foto. Tente novamente.',
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <LearnerScreenLayout
      minimalChrome
      isSessionLocked={learnerSession.isLocked}
      onRequestHelp={() =>
        learnerSession.requestHelp(
          isCarta
            ? 'Preciso de ajuda para enviar a foto da carta.'
            : 'Preciso de ajuda para enviar a foto da atividade.',
        )
      }
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      isHelpPending={learnerSession.isHelpPending}
      canRequestHelp
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="contain" />

        {sentOk ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentTitle}>
              {isCarta
                ? 'Sua carta foi enviada ao seu alfabetizador.'
                : 'Sua foto foi enviada ao seu alfabetizador.'}
            </Text>
            <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
              <Text style={styles.doneButtonText}>AVANÇAR</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionButton} onPress={() => void retakePhoto()} disabled={isSending}>
              <SvgXml xml={CAMERA_RETRY} width={50} height={42} />
              <Text style={styles.actionLabel}>{'FAZER OUTRA\nFOTO'}</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => void sendPhoto()} disabled={isSending}>
              {isSending ? (
                <ActivityIndicator color="#2fa536" size="large" />
              ) : (
                <SvgXml xml={CAMERA_SEND} width={62} height={42} />
              )}
              <Text style={styles.actionLabel}>{'ENVIAR\nFOTO'}</Text>
            </Pressable>
          </View>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 24,
    paddingTop: 12,
  },
  preview: {
    width: '100%',
    height: 340,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  actionButton: {
    minWidth: 110,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    color: '#2fa536',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  sentBox: {
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
  },
  sentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101a3d',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#2fa536',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  errorText: {
    color: '#e30613',
    fontSize: 13,
    textAlign: 'center',
  },
});
