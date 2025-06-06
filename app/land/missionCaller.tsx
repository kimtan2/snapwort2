import { useRouter } from 'next/navigation';

export const useMissionCaller = () => {
  const router = useRouter();

  const startStatementMission = () => {
    console.log('Starting Statement/Stellungnahme Mission...');
    router.push('/missions/statementStellungnahme');
  };

  return {
    startStatementMission
  };
};