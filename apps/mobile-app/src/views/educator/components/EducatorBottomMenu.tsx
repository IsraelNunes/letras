import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MenuKey = 'inicio' | 'tutorial' | 'acompanhar' | 'pontuacao' | 'perfil';

interface EducatorBottomMenuProps {
  active?: MenuKey;
  onInicioPress?: () => void;
  onTutorialPress?: () => void;
  onAcompanharPress?: () => void;
  onPontuacaoPress?: () => void;
  onPerfilPress?: () => void;
}

type HandlerKey = 'onInicioPress' | 'onTutorialPress' | 'onAcompanharPress' | 'onPontuacaoPress' | 'onPerfilPress';

const ICONS: Record<MenuKey, ReturnType<typeof require>> = {
  inicio: require('../../../../assets/menu/inicio.png'),
  tutorial: require('../../../../assets/menu/tutorial.png'),
  acompanhar: require('../../../../assets/menu/acompanhar.png'),
  pontuacao: require('../../../../assets/menu/pontuacao.png'),
  perfil: require('../../../../assets/menu/perfil.png'),
};

const ITEMS: { key: MenuKey; label: string; onPress: HandlerKey }[] = [
  { key: 'inicio', label: 'Início', onPress: 'onInicioPress' },
  { key: 'tutorial', label: 'Tutorial', onPress: 'onTutorialPress' },
  { key: 'acompanhar', label: 'Acompanhar', onPress: 'onAcompanharPress' },
  { key: 'pontuacao', label: 'Pontuação', onPress: 'onPontuacaoPress' },
  { key: 'perfil', label: 'Perfil', onPress: 'onPerfilPress' },
];

export function EducatorBottomMenu({
  active,
  onInicioPress,
  onTutorialPress,
  onAcompanharPress,
  onPontuacaoPress,
  onPerfilPress,
}: EducatorBottomMenuProps) {
  const insets = useSafeAreaInsets();
  const handlers: Record<HandlerKey, (() => void) | undefined> = {
    onInicioPress,
    onTutorialPress,
    onAcompanharPress,
    onPontuacaoPress,
    onPerfilPress,
  };

  const isRounded = Platform.OS === 'ios' || insets.bottom > 0;
  const activeBorderRadius = isRounded ? 14 : 4;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.topBorder} />
      <View style={styles.row}>
        {ITEMS.map(({ key, label, onPress }) => {
          const isActive = active === key;
          const handler = handlers[onPress] as (() => void) | undefined;
          return (
            <Pressable
              key={key}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={handler}
              disabled={!handler}
              android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false, radius: 32 }}
            >
              <View
                style={[
                  styles.iconWrap,
                  isActive && { ...styles.iconWrapActive, borderRadius: activeBorderRadius },
                ]}
              >
                <Image source={ICONS[key]} style={styles.icon} resizeMode="contain" />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ededed',
  },
  topBorder: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 3,
  },
  itemActive: {
    borderTopWidth: 2,
    borderTopColor: '#20385f',
    marginTop: -1,
  },
  activeIndicator: {
    height: 0,
  },
  iconWrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#dde4f0',
    width: 56,
    height: 36,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  labelActive: {
    color: '#20385f',
    fontWeight: '700',
  },
});
