import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EducatorLoadingView } from '../views/EducatorLoadingView';
import { EducatorSplashView } from '../views/EducatorSplashView';
import { EducatorOnboardingStepTwoView } from '../views/EducatorOnboardingStepTwoView';
import { EducatorOnboardingStepThreeView } from '../views/EducatorOnboardingStepThreeView';
import { EducatorOnboardingConfirmView } from '../views/EducatorOnboardingConfirmView';
import { EducatorLearningModeView } from '../views/EducatorLearningModeView';
import { EducatorDashboardView } from '../views/EducatorDashboardView';
import { EducatorRootStackParamList } from '../types';

const Stack = createNativeStackNavigator<EducatorRootStackParamList>();

export function EducatorNavigator() {
  return (
    <Stack.Navigator initialRouteName="EducatorLoading">
      <Stack.Screen
        name="EducatorLoading"
        component={EducatorLoadingView}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="EducatorSplash"
        component={EducatorSplashView}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="EducatorOnboardingStepTwo"
        component={EducatorOnboardingStepTwoView}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EducatorOnboardingStepThree"
        component={EducatorOnboardingStepThreeView}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EducatorOnboardingConfirm"
        component={EducatorOnboardingConfirmView}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EducatorLearningMode"
        component={EducatorLearningModeView}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EducatorDashboard"
        component={EducatorDashboardView}
        options={{
          headerTitle: 'Letras Educador',
        }}
      />
    </Stack.Navigator>
  );
}
