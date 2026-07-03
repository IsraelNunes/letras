import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import YoutubePlayer, { PLAYER_STATES } from 'react-native-youtube-iframe';
import { EducatorRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorTutorialPlayer'>;

/**
 * Extrai o videoId de uma URL de embed do YouTube.
 * Ex: https://www.youtube.com/embed/a3PwM72rMLE → "a3PwM72rMLE"
 * Ex: https://www.youtube.com/embed?listType=playlist&list=... → null
 */
function extractVideoId(embedUrl: string): string | null {
  const match = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

/**
 * Monta a URL para abrir no app/browser do YouTube como fallback.
 */
function buildYoutubeUrl(embedUrl: string): string {
  const videoId = extractVideoId(embedUrl);
  if (videoId) {
    return `https://youtu.be/${videoId}`;
  }
  // playlist
  const list = new URL(embedUrl).searchParams.get('list');
  const index = new URL(embedUrl).searchParams.get('index') ?? '1';
  if (list) {
    return `https://www.youtube.com/playlist?list=${list}&index=${index}`;
  }
  return embedUrl;
}

export function EducatorTutorialPlayerView({ navigation, route }: Props) {
  const { embedUrl, title } = route.params;
  const videoId = extractVideoId(embedUrl);
  const [playing, setPlaying] = useState(true);

  const openInYoutube = useCallback(async () => {
    const url = buildYoutubeUrl(embedUrl);
    await Linking.openURL(url);
  }, [embedUrl]);

  const handleError = useCallback((error: string) => {
    Alert.alert(
      'Não foi possível reproduzir',
      'O vídeo não pôde ser carregado no app. Deseja abrir no YouTube?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir no YouTube', onPress: () => void openInYoutube() },
      ],
    );
    console.warn('[player] YouTube error:', error);
  }, [openInYoutube]);

  // Para vídeos sem ID (playlists sem vídeo específico), abre direto no YouTube
  if (!videoId) {
    void openInYoutube();
    navigation.goBack();
    return null;
  }

  const playerHeight = Platform.OS === 'web' ? 300 : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backText}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.playerWrap}>
        <YoutubePlayer
          height={playerHeight ?? 0}
          width={undefined}
          videoId={videoId}
          play={playing}
          onChangeState={(state: PLAYER_STATES) => {
            if (state === PLAYER_STATES.ENDED) setPlaying(false);
          }}
          onError={handleError}
          webViewStyle={styles.webview}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            domStorageEnabled: true,
          }}
          initialPlayerParams={{
            rel: false,
            modestbranding: true,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  playerWrap: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  webview: {
    backgroundColor: '#000',
  },
});
