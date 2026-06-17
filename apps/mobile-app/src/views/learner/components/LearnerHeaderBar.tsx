import { useAssets } from 'expo-asset';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { learnerTheme } from '../learnerTheme';

interface LearnerHeaderBarProps {
  roleLabel?: string;
  learnerName?: string | null;
  stageLabel?: string | null;
}

export function LearnerHeaderBar({ learnerName, stageLabel }: LearnerHeaderBarProps) {
  const [assets] = useAssets([require('../../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const hasSubtitle = Boolean(learnerName || stageLabel);

  return (
    <View>
      <View style={styles.wrapper}>
        <View style={styles.logoWrap}>
          {logoUri ? <SvgUri uri={logoUri} width={84} height={50} /> : <ActivityIndicator size="small" color={learnerTheme.textStrong} />}
        </View>
        <View style={styles.rightCol}>
          <View style={styles.notificationWrap}>
            <Image source={require('../../../../assets/notificacao.png')} style={styles.notificationIcon} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
        </View>
      </View>
      {hasSubtitle ? (
        <View style={styles.subtitleRow}>
          {learnerName ? (
            <Text style={styles.learnerNameText} numberOfLines={1}>
              {learnerName}
            </Text>
          ) : null}
          {learnerName && stageLabel ? (
            <Text style={styles.subtitleDot}> · </Text>
          ) : null}
          {stageLabel ? (
            <Text style={styles.stageLabelText} numberOfLines={1}>
              {stageLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  rightCol: {
    alignItems: 'center',
    gap: 2,
  },
  notificationWrap: {
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
    backgroundColor: learnerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: learnerTheme.surface,
    fontSize: 9,
    fontWeight: '700',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginTop: 4,
    paddingBottom: 2,
  },
  learnerNameText: {
    color: learnerTheme.textMuted,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  subtitleDot: {
    color: learnerTheme.textMuted,
    fontSize: 11,
  },
  stageLabelText: {
    color: learnerTheme.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
});
