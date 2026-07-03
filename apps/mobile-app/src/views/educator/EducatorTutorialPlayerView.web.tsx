import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EducatorRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorTutorialPlayer'>;

export function EducatorTutorialPlayerView({ navigation, route }: Props) {
  const { embedUrl, title } = route.params;
  const uri = `${embedUrl}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.backText}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.playerWrap}>
        <WebView source={{ uri }} style={styles.player} javaScriptEnabled allowsInlineMediaPlayback />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  playerWrap: { flex: 1, backgroundColor: '#000' },
  player: { flex: 1, backgroundColor: '#000' },
});
