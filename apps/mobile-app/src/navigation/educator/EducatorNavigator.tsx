import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { EducatorLoadingView } from '../../views/educator/EducatorLoadingView';
import { EducatorLoginView } from '../../views/educator/EducatorLoginView';
import { EducatorSplashView } from '../../views/educator/EducatorSplashView';
import { EducatorProfileView } from '../../views/educator/EducatorProfileView';
import { EducatorOnboardingStepTwoView } from '../../views/educator/EducatorOnboardingStepTwoView';
import { EducatorOnboardingStepThreeView } from '../../views/educator/EducatorOnboardingStepThreeView';
import { EducatorOnboardingConfirmView } from '../../views/educator/EducatorOnboardingConfirmView';
import { EducatorLearningModeView } from '../../views/educator/EducatorLearningModeView';
import { EducatorHomeView } from '../../views/educator/EducatorHomeView';
import { EducatorLinkConfirmView } from '../../views/educator/EducatorLinkConfirmView';
import { EducatorLinkSuccessView } from '../../views/educator/EducatorLinkSuccessView';
import { LearnerOnboardingStep1View } from '../../views/learner/LearnerOnboardingStep1View';
import { LearnerOnboardingStep2View } from '../../views/learner/LearnerOnboardingStep2View';
import { LearnerOnboardingConfirmView } from '../../views/learner/LearnerOnboardingConfirmView';
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
        name="LearnerOnboardingStep1"
        component={LearnerOnboardingStep1View as React.ComponentType<object>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LearnerOnboardingStep2"
        component={LearnerOnboardingStep2View as React.ComponentType<object>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LearnerOnboardingConfirm"
        component={LearnerOnboardingConfirmView as React.ComponentType<object>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EducatorHome"
        component={EducatorHomeView}
        options={{
          headerShown: false,
          gestureEnabled: false,
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
        name="EducatorLinkConfirm"
        component={EducatorLinkConfirmView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EducatorLinkSuccess"
        component={EducatorLinkSuccessView}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
