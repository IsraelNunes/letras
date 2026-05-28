import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { LearnerLoadingView } from '../../views/learner/LearnerLoadingView';
import { LearnerFirstAccessGateView } from '../../views/learner/LearnerFirstAccessGateView';
import { LearnerCpfLoginView } from '../../views/learner/LearnerCpfLoginView';
import { LearnerLinkStep1View } from '../../views/learner/LearnerLinkStep1View';
import { LearnerLinkSuccessView } from '../../views/learner/LearnerLinkSuccessView';
import { LearnerOnboardingStep1View } from '../../views/learner/LearnerOnboardingStep1View';
import { LearnerOnboardingStep2View } from '../../views/learner/LearnerOnboardingStep2View';
import { LearnerOnboardingConfirmView } from '../../views/learner/LearnerOnboardingConfirmView';
import { LearnerHomeView } from '../../views/learner/LearnerHomeView';
import { LearnerProfileView } from '../../views/learner/LearnerProfileView';
import { LearnerLessonIntroView } from '../../views/learner/LearnerLessonIntroView';
import { LearnerLessonScreenView } from '../../views/learner/LearnerLessonScreenView';
import { LearnerLessonActivityView } from '../../views/learner/LearnerLessonActivityView';
import { LearnerLessonConclusionView } from '../../views/learner/LearnerLessonConclusionView';
import { LearnerSessionProvider } from '../../views/learner/learnerSessionContext';

const Stack = createNativeStackNavigator<LearnerRootStackParamList>();

export function LearnerNavigator() {
  return (
    <LearnerSessionProvider>
      <Stack.Navigator initialRouteName="LearnerLoading">
        <Stack.Screen
          name="LearnerLoading"
          component={LearnerLoadingView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerFirstAccessGate"
          component={LearnerFirstAccessGateView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerCpfLogin"
          component={LearnerCpfLoginView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerLinkStep1"
          component={LearnerLinkStep1View}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerLinkSuccess"
          component={LearnerLinkSuccessView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerOnboardingStep1"
          component={LearnerOnboardingStep1View}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerOnboardingStep2"
          component={LearnerOnboardingStep2View}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerOnboardingConfirm"
          component={LearnerOnboardingConfirmView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerHome"
          component={LearnerHomeView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerProfile"
          component={LearnerProfileView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerLessonIntro"
          component={LearnerLessonIntroView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerLessonScreen"
          component={LearnerLessonScreenView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerLessonActivity"
          component={LearnerLessonActivityView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearnerLessonConclusion"
          component={LearnerLessonConclusionView}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </LearnerSessionProvider>
  );
}
