import { Pressable, View } from 'react-native';
import { Text } from 'heroui-native';
import { ArrowRight } from 'lucide-react-native';

import { palette } from '@/lib/theme';

interface ChoiceButtonProps {
  letter: string;
  label: string;
  /** The first option gets the warmer, more inviting treatment. */
  emphasis?: 'primary' | 'secondary';
  onPress: () => void;
}

/** One of the two decisions at the bottom of a scene. */
export function ChoiceButton({
  letter,
  label,
  emphasis = 'secondary',
  onPress,
}: ChoiceButtonProps) {
  const isPrimary = emphasis === 'primary';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.985 : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        className={
          isPrimary
            ? 'border-accent/45 flex-row items-center gap-3 rounded-3xl border px-4 py-4'
            : 'border-border/80 flex-row items-center gap-3 rounded-3xl border px-4 py-4'
        }
        style={{
          backgroundColor: isPrimary ? 'rgba(251, 171, 85, 0.13)' : 'rgba(36, 29, 22, 0.92)',
        }}
      >
        <View
          className="border-accent/40 h-9 w-9 items-center justify-center rounded-full border"
          style={{ backgroundColor: palette.accentSoft }}
        >
          <Text className="text-accent text-sm font-bold tracking-widest">
            {letter.toUpperCase()}
          </Text>
        </View>
        <Text className="text-foreground flex-1 text-lg leading-6 font-medium">{label}</Text>
        <ArrowRight size={18} color={isPrimary ? palette.accent : palette.muted} />
      </View>
    </Pressable>
  );
}
