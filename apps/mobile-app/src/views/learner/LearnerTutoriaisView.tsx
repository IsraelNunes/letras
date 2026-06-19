import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { TutoriaisContent } from '../educator/components/TutoriaisContent';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerTutorials'>;

export function LearnerTutoriaisView({ navigation }: Props) {
  const [educatorId, setEducatorId] = useState<string | undefined>();

  useEffect(() => {
    void (async () => {
      const { EducatorStorage } = await import('../../infra/storage/educator-storage');
      const profile = await EducatorStorage.getAuthProfile();
      if (profile?.id) setEducatorId(profile.id);
    })();
  }, []);

  return (
    <TutoriaisContent
      educatorId={educatorId}
      onBack={() => navigation.navigate('LearnerHome')}
    />
  );
}
