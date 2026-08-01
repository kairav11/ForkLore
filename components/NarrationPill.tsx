import { Pressable, View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import { palette } from '@/lib/theme';
import { Mono } from '@/components/ui/Text';

interface NarrationPillProps {
  isPlaying: boolean;
  onPress: () => void;
}

/** Compact amber-outlined pill that plays the narrated line of a scene. */
export function NarrationPill({ isPlaying, onPress }: NarrationPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause narration' : 'Play narration'}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, alignSelf: 'flex-start' })}
    >
      <View
        className="h-9 flex-row items-center gap-2 rounded-full px-3.5"
        style={{
          backgroundColor: palette.accentSoft,
          borderWidth: 1,
          borderColor: palette.pathAEdge,
        }}
      >
        {isPlaying ? (
          <Pause size={13} color={palette.accent} />
        ) : (
          <Play size={13} color={palette.accent} />
        )}
        <Mono className="text-[10px] tracking-[2px] uppercase" color={palette.accent}>
          {isPlaying ? 'Pause' : 'Listen'}
        </Mono>
      </View>
    </Pressable>
  );
}
