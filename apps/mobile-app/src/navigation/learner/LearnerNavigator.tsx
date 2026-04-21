import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { LearnerHomeView } from '../../views/learner/LearnerHomeView';
import { LearnerLessonIntroView } from '../../views/learner/LearnerLessonIntroView';
import { LearnerLessonScreenView } from '../../views/learner/LearnerLessonScreenView';
import { LearnerLessonActivityView } from '../../views/learner/LearnerLessonActivityView';
import { LearnerLessonConclusionView } from '../../views/learner/LearnerLessonConclusionView';
import { LearnerSessionProvider } from '../../views/learner/learnerSessionContext';

const Stack = createNativeStackNavigator<LearnerRootStackParamList>();

export function LearnerNavigator() {
  return (
    <LearnerSessionProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="LearnerHome"
          component={LearnerHomeView}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LearnerLessonIntro"
          component={LearnerLessonIntroView}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LearnerLessonScreen"
          component={LearnerLessonScreenView}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LearnerLessonActivity"
          component={LearnerLessonActivityView}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LearnerLessonConclusion"
          component={LearnerLessonConclusionView}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </LearnerSessionProvider>
  );
}
