import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EducatorLoadingView } from '../../views/educator/EducatorLoadingView';
import { EducatorLoginView } from '../../views/educator/EducatorLoginView';
import { EducatorSplashView } from '../../views/educator/EducatorSplashView';
import { EducatorProfileView } from '../../views/educator/EducatorProfileView';
import { EducatorOnboardingStepTwoView } from '../../views/educator/EducatorOnboardingStepTwoView';
import { EducatorOnboardingStepThreeView } from '../../views/educator/EducatorOnboardingStepThreeView';
import { EducatorOnboardingConfirmView } from '../../views/educator/EducatorOnboardingConfirmView';
import { EducatorLearningModeView } from '../../views/educator/EducatorLearningModeView';
import { EducatorRootStackParamList } from '../../types';

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
        name="EducatorLogin"
        component={EducatorLoginView}
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
        name="EducatorProfile"
        component={EducatorProfileView}
        options={{
          headerShown: false,
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
    </Stack.Navigator>
  );
}
