import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { EducatorNavigator } from './educator/EducatorNavigator';
import { LearnerNavigator } from './learner/LearnerNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="EducatorFlow">
      <Stack.Screen
        name="EducatorFlow"
        component={EducatorNavigator}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="LearnerFlow"
        component={LearnerNavigator}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
