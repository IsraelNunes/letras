import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EducatorDashboardView } from '../views/EducatorDashboardView';
import { EducatorRootStackParamList } from '../types';

const Stack = createNativeStackNavigator<EducatorRootStackParamList>();

export function EducatorNavigator() {
  return (
    <Stack.Navigator>
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
