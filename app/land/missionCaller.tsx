import { useRouter } from 'next/navigation';

export const useMissionCaller = () => {
  const router = useRouter();

  const startStatementMission = () => {
    console.log('Starting Statement/Stellungnahme Mission...');
    router.push('/missions/statementStellungnahme');
  };

  const startCustomMission = (missionData: Record<string, unknown>) => {
    console.log('Starting Custom Mission with data:', missionData);
    // Store the custom mission data in sessionStorage for the mission component to access
    sessionStorage.setItem('currentCustomMission', JSON.stringify(missionData));
    router.push('/missions/statementStellungnahme');
  };

  return {
    startStatementMission,
    startCustomMission
  };
};