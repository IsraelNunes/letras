import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerTutorials'>;

// Por enquanto o alfabetizando não tem tutoriais próprios em vídeo: o conteúdo
// instrucional dele é a narração em áudio das atividades. A aba existe no menu,
// então mostramos um estado "em breve" em vez de reusar a lista do educador.
export function LearnerTutoriaisView({ navigation }: Props) {
  return (
    <LearnerScreenLayout
      activeMenu="tutorial"
      onMenuHome={() => navigation.navigate('LearnerHome')}
    >
      <View style={styles.wrap}>
        <Text style={styles.title}>Tutoriais em breve</Text>
        <Text style={styles.body}>
          As dicas de apoio aparecem durante as suas atividades, quando você
          precisar. Em breve você também terá tutoriais próprios aqui.
        </Text>
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 40,
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
    textAlign: 'center',
  },
});
