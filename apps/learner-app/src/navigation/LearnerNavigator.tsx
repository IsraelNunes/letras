import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnerHomeView } from '../views/LearnerHomeView';
import { LearnerRootStackParamList } from '../types';

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
