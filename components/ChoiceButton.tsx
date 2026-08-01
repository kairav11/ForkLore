import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { palette, pathTone } from '@/lib/theme';
import { Body, Mono } from '@/components/ui/Text';

interface ChoiceButtonProps {
  letter: string;
  label: string;
  /** 0 = first option (amber), 1 = second option (violet-blue). */
  index: number;
  /** The scene behind this choice is not written yet. */
  disabled?: boolean;
  onPress: () => void;
}

/**
 * One of the two decisions at the bottom of a scene: a pill tinted with its own
 * path colour, so the two options are told apart by colour and not just order.
 */
export function ChoiceButton({
  letter,
  label,
  index,
  disabled = false,
  onPress,
}: ChoiceButtonProps) {
  const tone = pathTone(index);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Option ${letter.toUpperCase()}: ${label}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        opacity: disabled ? 0.42 : pressed ? 0.86 : 1,
      })}
    >
      <View
        className="flex-row items-center gap-3 overflow-hidden rounded-full border py-3 pr-4 pl-3"
        style={{ backgroundColor: palette.panel, borderColor: tone.edge }}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: tone.soft }]}
        />

        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: tone.color }}
        >
          <Mono weight="bold" className="text-[13px]" color={palette.background}>
            {letter.toUpperCase()}
          </Mono>
        </View>

        <Body weight="medium" className="flex-1 text-[17px] leading-[23px]">
          {label}
        </Body>

        <ArrowRight size={17} color={tone.color} />
      </View>
    </Pressable>
  );
}
