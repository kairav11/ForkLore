import { View } from 'react-native';

import { palette } from '@/lib/theme';

interface SceneProgressProps {
  /** Number of decisions in the story. */
  total: number;
  /** Decisions already made. */
  made: number;
}

/** Slim amber bars showing how far into the story the reader is. */
export function SceneProgress({ total, made }: SceneProgressProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          className="h-1 w-6 rounded-full"
          style={{
            backgroundColor: index < made ? palette.accent : 'rgba(248, 243, 234, 0.22)',
          }}
        />
      ))}
    </View>
  );
}
