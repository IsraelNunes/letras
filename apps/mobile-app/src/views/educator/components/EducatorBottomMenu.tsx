import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

type MenuKey = 'inicio' | 'tutorial' | 'acompanhar' | 'pontuacao' | 'perfil';

interface EducatorBottomMenuProps {
  active?: MenuKey;
  onInicioPress?: () => void;
  onTutorialPress?: () => void;
  onAcompanharPress?: () => void;
  onPontuacaoPress?: () => void;
  onPerfilPress?: () => void;
}

const ICON_INICIO = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z" fill="currentColor"/></svg>`;

const ICON_TUTORIAL = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor" fill-rule="nonzero"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm18 0H3v8h18V5zM11 16h2v4h-2zM7 21a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1z"/></g></svg>`;

const ICON_ACOMPANHAR = `<svg viewBox="0 0 468.613 468.614" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><path d="M187.947 116.517h-3.498c10.625-12.361 17.099-28.379 17.099-45.916C201.548 31.667 169.869 0 130.952 0 92.023 0 60.363 31.667 60.363 70.601c0 17.537 6.47 33.555 17.102 45.916h-3.506c-19.651 0-35.627 16-35.627 35.645v117.105c0 19.647 15.982 35.633 35.627 35.633h1.384v128.07c0 20.332 10.683 35.644 24.872 35.644h61.477c14.192 0 24.905-15.312 24.905-35.644V304.893h1.363c19.642 0 35.635-15.99 35.635-35.632v-117.1c0-19.644-15.99-35.644-35.648-35.644z"/><path d="M394.649 116.517h-3.507c10.635-12.361 17.102-28.379 17.102-45.916C408.244 31.667 376.581 0 337.646 0c-38.911 0-70.593 31.667-70.593 70.601 0 17.537 6.479 33.555 17.102 45.916h-3.488c-19.654 0-35.627 16-35.627 35.645v117.105c0 19.647 15.985 35.633 35.627 35.633h1.363v128.07c0 20.332 10.7 35.644 24.884 35.644h61.477c14.195 0 24.896-15.312 24.896-35.644V304.893h1.369c19.635 0 35.626-15.99 35.626-35.632v-117.1c0-19.644-15.985-35.644-35.633-35.644z"/></g></svg>`;

const ICON_PONTUACAO = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><path d="M256 73c-66.3.1-119.9 53.7-120 120 .1 66.3 53.7 119.9 120 120.1 66.3-.1 119.9-53.8 120-120.1C375.9 126.7 322.3 73.1 256 73z"/><path d="M434.1 203.8c-4.4-5.9-4.4-15.6 0-21.6l9.6-13c4.4-5.9 3-14.1-3.2-18.2l-13.5-8.9c-6.2-4-9.5-13.2-7.4-20.3l4.6-15.5c2.1-7.1-2-14.3-9.2-16l-15.7-3.7c-7.2-1.7-13.4-9.1-13.9-16.5l-.9-16.1c-.4-7.4-6.8-12.7-14.1-11.9l-16 1.9c-7.3.9-15.7-4-18.7-10.8l-6.4-14.8c-2.9-6.8-10.7-9.6-17.3-6.3l-14.4 7.2c-6.6 3.3-16.2 1.6-21.2-3.7l-11.1-11.7c-5.1-5.4-13.4-5.4-18.4 0l-11.1 11.7c-5.1 5.4-14.6 7-21.2 3.7l-14.4-7.2c-6.6-3.3-14.4-.5-17.3 6.3l-6.4 14.8c-2.9 6.8-11.3 11.6-18.7 10.8l-16-1.9c-7.3-.8-13.7 4.5-14.1 11.9l-.9 16.1c-.4 7.4-6.7 14.8-13.9 16.5l-15.7 3.7c-7.2 1.7-11.3 8.9-9.2 16l4.6 15.5c2.1 7.1-1.2 16.2-7.4 20.3l-13.5 8.9c-6.2 4.1-7.6 12.2-3.2 18.2l9.6 13c4.4 5.9 4.4 15.6 0 21.6l-9.6 13c-4.4 5.9-3 14.1 3.2 18.2l13.5 8.9c6.2 4 9.5 13.2 7.4 20.3l-4.6 15.5c-2.1 7.1 2 14.3 9.2 16l15.7 3.7c7.2 1.7 13.4 9.1 13.9 16.5l.9 16.1c.4 7.4 6.8 12.7 14.1 11.9l16-1.9c7.3-.8 15.7 4 18.7 10.8l6.4 14.8c2.9 6.8 10.7 9.6 17.3 6.3l14.4-7.2c6.6-3.3 16.2-1.6 21.2 3.7l11.1 11.7c5.1 5.4 13.4 5.4 18.4 0l11.1-11.7c5.1-5.4 14.6-7 21.2-3.7l14.4 7.2c6.6 3.3 14.4.5 17.3-6.3l6.4-14.8c2.9-6.8 11.3-11.6 18.7-10.8l16 1.9c7.3.8 13.7-4.5 14.1-11.9l.9-16.1c.4-7.4 6.7-14.8 13.9-16.5l15.7-3.7c7.2-1.7 11.3-8.9 9.2-16l-4.6-15.5c-2.1-7.1 1.2-16.2 7.4-20.3l13.5-8.9c6.2-4.1 7.6-12.2 3.2-18.2l-9.6-13zM256 330.9c-76.2 0-137.9-61.7-137.9-137.9S179.8 55.1 256 55.1s137.9 61.7 137.9 137.9S332.2 330.9 256 330.9z"/><path d="M223 382.9l-14.1 7c-4.3 2.1-9 3.3-13.8 3.3-12.1 0-23.1-7.3-28-18.5l-6.4-14.8-.1.1-.5-.2-8.7 1L87 459.8l65.4-11.3 15.5 64.5 73.8-112.3c-2.6-1.4-5-3.2-7.1-5.4L223 382.9z"/><path d="M352.8 359.7l-6.2 14.4c-4.8 11.2-15.8 18.5-28 18.5-4.7 0-9.5-1.1-13.8-3.3l-14-7-.9.1-10.8 11.4c-2.4 2.6-5.4 4.6-8.5 6.2L343.1 512l15.5-64.5 65.4 11.3-64.7-98.3-6.5-.8z"/></g></svg>`;

const ICON_PERFIL = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12C22 6.49 17.51 2 12 2C6.49 2 2 6.49 2 12C2 14.9 3.25 17.51 5.23 19.34C5.32 19.46 5.44 19.54 5.54 19.63C5.6 19.68 5.65 19.73 5.71 19.77C5.89 19.92 6.09 20.06 6.28 20.2C6.35 20.25 6.41 20.29 6.48 20.34C6.67 20.47 6.87 20.59 7.08 20.7C7.15 20.74 7.23 20.79 7.3 20.83C7.5 20.94 7.71 21.04 7.93 21.13C8.01 21.17 8.09 21.21 8.17 21.24C8.39 21.33 8.61 21.41 8.83 21.48C8.91 21.51 8.99 21.54 9.07 21.56C9.31 21.63 9.55 21.69 9.79 21.75C10.29 21.86 10.57 21.9 10.86 21.93C11.32 21.98 11.66 22 12 22C12.34 22 12.68 21.98 13.01 21.95C13.42 21.9 13.7 21.86 13.98 21.8C14.44 21.69 14.69 21.64 14.92 21.56C15.38 21.4 15.61 21.33 15.82 21.24C16.27 21.04 16.48 20.94 16.69 20.83C16.91 20.58 17.11 20.47 17.51 20.34C17.91 20.06 18.1 19.92 18.28 19.77C18.45 19.63 18.56 19.54 18.77 19.36C20.75 17.51 22 14.9 22 12ZM16.94 16.97C14.23 15.15 9.79 15.15 7.06 16.97C5.96 17.97 4.44 16.43 3.5 12C3.5 7.31 7.31 3.5 12 3.5C16.69 3.5 20.5 7.31 20.5 12C20.5 14.32 19.56 16.43 18.04 17.97C17.75 17.6 17.38 17.26 16.94 16.97Z" fill="currentColor"/><path d="M12 6.93C9.93 6.93 8.25 8.61 8.25 10.68C8.25 12.71 9.84 14.36 11.95 14.42C12.02 14.42 12.09 14.42 12.13 14.42C14.15 14.35 15.74 12.71 15.75 10.68C15.75 8.61 14.07 6.93 12 6.93Z" fill="currentColor"/></svg>`;

type HandlerKey = 'onInicioPress' | 'onTutorialPress' | 'onAcompanharPress' | 'onPontuacaoPress' | 'onPerfilPress';

const ITEMS: { key: MenuKey; label: string; icon: string; onPress: HandlerKey }[] = [
  { key: 'inicio', label: 'Início', icon: ICON_INICIO, onPress: 'onInicioPress' },
  { key: 'tutorial', label: 'Tutorial', icon: ICON_TUTORIAL, onPress: 'onTutorialPress' },
  { key: 'acompanhar', label: 'Acompanhar', icon: ICON_ACOMPANHAR, onPress: 'onAcompanharPress' },
  { key: 'pontuacao', label: 'Pontuação', icon: ICON_PONTUACAO, onPress: 'onPontuacaoPress' },
  { key: 'perfil', label: 'Perfil', icon: ICON_PERFIL, onPress: 'onPerfilPress' },
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

  // Devices with a home indicator (bottom inset > 0) or iOS get rounded active pill,
  // others (square Android phones) get a subtler square highlight.
  const isRounded = Platform.OS === 'ios' || insets.bottom > 0;
  const activeBorderRadius = isRounded ? 14 : 4;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.topBorder} />
      <View style={styles.row}>
        {ITEMS.map(({ key, label, icon, onPress }) => {
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
                <SvgXml
                  xml={icon}
                  width={22}
                  height={22}
                  color={isActive ? '#20385f' : '#6b7280'}
                />
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
    // borda superior já cuida da indicação visual — este elemento é reservado
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
