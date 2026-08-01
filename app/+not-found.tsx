import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ErrorState } from '@/components/StoryStatus';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="bg-background flex-1">
      <ErrorState
        title="This page does not exist"
        message="The link you followed leads nowhere. Start a new story or open one a friend shared."
        actionLabel="Start a new story"
        onAction={() => router.replace('/')}
        secondaryLabel="Enter a shared story"
        onSecondary={() => router.replace('/enter')}
      />
    </View>
  );
}
