import { Image, Pressable, StyleSheet, View } from 'react-native';
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

export function EducatorBottomMenu({
  active,
  onInicioPress,
  onTutorialPress,
  onAcompanharPress,
  onPontuacaoPress,
  onPerfilPress,
}: EducatorBottomMenuProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.row}>
        <Pressable
          style={[styles.item, active === 'inicio' ? styles.activeItem : null]}
          onPress={onInicioPress}
          disabled={!onInicioPress}
        >
          <Image source={require('../../../assets/menu/inicio.png')} style={styles.image79} />
        </Pressable>
        <Pressable
          style={[styles.item, active === 'tutorial' ? styles.activeItem : null]}
          onPress={onTutorialPress}
          disabled={!onTutorialPress}
        >
          <Image source={require('../../../assets/menu/tutorial.png')} style={styles.image79} />
        </Pressable>
        <Pressable
          style={[styles.item, active === 'acompanhar' ? styles.activeItem : null]}
          onPress={onAcompanharPress}
          disabled={!onAcompanharPress}
        >
          <Image source={require('../../../assets/menu/acompanhar.png')} style={styles.image79} />
        </Pressable>
        <Pressable
          style={[styles.item, active === 'pontuacao' ? styles.activeItem : null]}
          onPress={onPontuacaoPress}
          disabled={!onPontuacaoPress}
        >
          <Image source={require('../../../assets/menu/pontuacao.png')} style={styles.image78} />
        </Pressable>
        <Pressable
          style={[styles.item, active === 'perfil' ? styles.activeItem : null]}
          onPress={onPerfilPress}
          disabled={!onPerfilPress}
        >
          <Image source={require('../../../assets/menu/perfil.png')} style={styles.image78} />
        </Pressable>
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
    alignItems: 'center',
    backgroundColor: '#ededed',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    opacity: 0.85,
  },
  activeItem: {
    opacity: 1,
  },
  image79: {
    width: 79,
    height: 57,
    resizeMode: 'contain',
  },
  image78: {
    width: 78,
    height: 57,
    resizeMode: 'contain',
  },
});
