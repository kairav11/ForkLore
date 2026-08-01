import { View } from 'react-native';

import { palette } from '@/lib/theme';
import type { StoryLine } from '@/lib/types';
import { Body, Mono } from '@/components/ui/Text';

interface SceneTextProps {
  /** Narration and spoken lines in the order they happen. */
  lines: StoryLine[];
  /** Whole-scene transcript, used for scenes written before lines existed. */
  text: string;
  size?: 'reader' | 'ending' | 'recap';
}

const BODY_CLASS: Record<NonNullable<SceneTextProps['size']>, string> = {
  reader: 'text-[17px] leading-[27px]',
  ending: 'text-[17px] leading-[28px]',
  recap: 'text-[16px] leading-[26px]',
};

/**
 * A scene reads as narration with the occasional spoken line. Dialogue is set
 * apart by a hairline rule and the speaker's name rather than by colour — amber
 * and violet-blue stay reserved for the two story paths.
 */
export function SceneText({ lines, text, size = 'reader' }: SceneTextProps) {
  const resolved: StoryLine[] =
    lines.length > 0 ? lines : text.trim().length > 0 ? [{ speaker: null, text }] : [];
  const bodyClass = BODY_CLASS[size];

  return (
    <View className="gap-3">
      {resolved.map((line) =>
        line.speaker ? (
          <View key={`${line.speaker}:${line.text}`} className="flex-row gap-3">
            <View
              className="w-[2px] rounded-full"
              style={{ backgroundColor: palette.borderStrong }}
            />
            <View className="flex-1 gap-1">
              <Mono className="text-[10px] tracking-[2px] uppercase">{line.speaker}</Mono>
              <Body weight="medium" className={bodyClass}>
                {line.text}
              </Body>
            </View>
          </View>
        ) : (
          <Body key={`narration:${line.text}`} className={bodyClass}>
            {line.text}
          </Body>
        ),
      )}
    </View>
  );
}
