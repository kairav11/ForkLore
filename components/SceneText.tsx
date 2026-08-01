import { Text as RNText, View } from 'react-native';

import { palette } from '@/lib/theme';
import type { StoryLine } from '@/lib/types';
import { splitWords } from '@/lib/utils';
import { Body, Mono } from '@/components/ui/Text';

interface SceneTextProps {
  /** Narration and spoken lines in the order they happen. */
  lines: StoryLine[];
  /** Whole-scene transcript, used for scenes written before lines existed. */
  text: string;
  size?: 'reader' | 'ending' | 'recap';
  /** Line currently being narrated, -1 when nothing is playing. */
  activeLine?: number;
  /** Word inside that line, -1 when its timing is unknown. */
  activeWord?: number;
  /** Reports where each line sits, so the panel can scroll it into view. */
  onLineLayout?: (index: number, y: number, height: number) => void;
}

const BODY_CLASS: Record<NonNullable<SceneTextProps['size']>, string> = {
  reader: 'text-[17px] leading-[27px]',
  ending: 'text-[17px] leading-[28px]',
  recap: 'text-[16px] leading-[26px]',
};

/** Words not yet spoken sit back a little so the narrated one leads the eye. */
const AHEAD_COLOR = 'rgba(242, 239, 233, 0.5)';

interface LineBodyProps {
  text: string;
  className: string;
  weight?: 'regular' | 'medium';
  /** -1 when this line is not being narrated. */
  activeWord: number;
}

/**
 * One line of story text. While it is being narrated the words are rendered
 * individually: the word being spoken is amber, the ones still to come are held
 * back. Otherwise the line is a single run of text, which is cheaper and wraps
 * identically.
 */
function LineBody({ text, className, weight = 'regular', activeWord }: LineBodyProps) {
  if (activeWord < 0) {
    return (
      <Body weight={weight} className={className}>
        {text}
      </Body>
    );
  }

  return (
    <Body weight={weight} className={className}>
      {splitWords(text).map((token) => {
        if (token.index < 0) return <RNText key={`gap-${token.position}`}>{token.text}</RNText>;
        const color =
          token.index === activeWord
            ? palette.accent
            : token.index < activeWord
              ? palette.foreground
              : AHEAD_COLOR;
        return (
          <RNText key={`word-${token.index}`} style={{ color }}>
            {token.text}
          </RNText>
        );
      })}
    </Body>
  );
}

/**
 * A scene reads as narration with the occasional spoken line. Dialogue is set
 * apart by a hairline rule and the speaker's name rather than by colour — amber
 * and violet-blue stay reserved for the two story paths, apart from the single
 * word the narrator is on.
 */
export function SceneText({
  lines,
  text,
  size = 'reader',
  activeLine = -1,
  activeWord = -1,
  onLineLayout,
}: SceneTextProps) {
  const resolved: StoryLine[] =
    lines.length > 0 ? lines : text.trim().length > 0 ? [{ speaker: null, text }] : [];
  const bodyClass = BODY_CLASS[size];
  const seenLines = new Map<string, number>();

  return (
    <View className="gap-3">
      {resolved.map((line, index) => {
        const wordInLine = index === activeLine ? activeWord : -1;
        const lineBase = `${line.speaker ?? 'narration'}:${line.text}`;
        const occurrence = seenLines.get(lineBase) ?? 0;
        seenLines.set(lineBase, occurrence + 1);
        const lineKey = occurrence === 0 ? lineBase : `${lineBase}#${occurrence}`;

        return (
          <View
            key={lineKey}
            onLayout={
              onLineLayout
                ? (event) => {
                    const { y, height } = event.nativeEvent.layout;
                    onLineLayout(index, y, height);
                  }
                : undefined
            }
          >
            {line.speaker ? (
              <View className="flex-row gap-3">
                <View
                  className="w-[2px] rounded-full"
                  style={{ backgroundColor: palette.borderStrong }}
                />
                <View className="flex-1 gap-1">
                  <Mono
                    className="text-[10px] tracking-[2px] uppercase"
                    color={index === activeLine ? palette.accent : undefined}
                  >
                    {line.speaker}
                  </Mono>
                  <LineBody
                    text={line.text}
                    className={bodyClass}
                    weight="medium"
                    activeWord={wordInLine}
                  />
                </View>
              </View>
            ) : (
              <LineBody text={line.text} className={bodyClass} activeWord={wordInLine} />
            )}
          </View>
        );
      })}
    </View>
  );
}
