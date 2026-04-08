import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AppModeGateView } from '../views/AppModeGateView';
import { EducatorNavigator } from './educator/EducatorNavigator';
import { LearnerNavigator } from './learner/LearnerNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="AppModeGate">
      <Stack.Screen
        name="AppModeGate"
        component={AppModeGateView}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
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
