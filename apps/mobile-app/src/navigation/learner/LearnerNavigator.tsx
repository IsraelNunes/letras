import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { LearnerHomeView } from '../../views/learner/LearnerHomeView';

const Stack = createNativeStackNavigator<LearnerRootStackParamList>();

export function LearnerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LearnerHome"
        component={LearnerHomeView}
        options={{
          headerTitle: 'Letras Aprendiz',
        }}
      />
    </Stack.Navigator>
  );
}
