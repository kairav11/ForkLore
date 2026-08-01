import { View } from 'react-native';
import { Image } from 'expo-image';
import { CornerDownRight } from 'lucide-react-native';

import { palette, pathTone } from '@/lib/theme';
import type { Decision, StoryNode } from '@/lib/types';
import { SceneText } from '@/components/SceneText';
import { Body, Mono } from '@/components/ui/Text';

interface ReplaySceneCardProps {
  /** Position in the replay, which is also the narration's scene index. */
  index: number;
  node: StoryNode;
  /** The decision made in this scene, or null for the ending. */
  decision: Decision | null;
  /** This scene is being read aloud right now. */
  isActive: boolean;
  /** Line inside this scene being spoken, -1 when it is not. */
  activeLine: number;
  activeWord: number;
  /** Where the card sits in the list, so the reading can scroll to it. */
  onCardLayout: (index: number, y: number) => void;
  /** Where the text block sits inside the card. */
  onTextLayout: (index: number, y: number) => void;
  /** Where one line sits inside the text block. */
  onLineLayout: (index: number, line: number, y: number, height: number) => void;
}

const SCENE_IMAGE_HEIGHT = 180;

/**
 * One scene of the replay: its art, its text, and the choice that led out of it.
 * While the whole story is being read aloud the active card takes an amber
 * outline and its spoken words are highlighted, exactly as in the reader.
 */
export function ReplaySceneCard({
  index,
  node,
  decision,
  isActive,
  activeLine,
  activeWord,
  onCardLayout,
  onTextLayout,
  onLineLayout,
}: ReplaySceneCardProps) {
  const isEnding = decision === null;
  const tone = pathTone(decision?.choiceLetter.toLowerCase() === 'a' ? 0 : 1);
  const borderColor = isActive ? palette.accent : isEnding ? palette.pathAEdge : palette.border;

  return (
    <View
      onLayout={(event) => onCardLayout(index, event.nativeEvent.layout.y)}
      className="gap-3 rounded-3xl p-4"
      style={{ backgroundColor: palette.panel, borderWidth: 1, borderColor }}
    >
      {isEnding ? (
        <Mono className="text-[10px] tracking-[3px] uppercase" color={palette.accent}>
          The end
        </Mono>
      ) : (
        <View className="flex-row items-center gap-3">
          <Mono className="text-[10px] tracking-[2px] uppercase">{`Scene ${index + 1}`}</Mono>
          <View className="h-[2px] flex-1" style={{ backgroundColor: palette.border }} />
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: tone.color }}
          >
            <Mono weight="bold" className="text-[10px]" color={palette.background}>
              {decision.choiceLetter.toUpperCase()}
            </Mono>
          </View>
        </View>
      )}

      {node.imageUrl ? (
        <Image
          source={{ uri: node.imageUrl }}
          style={{ width: '100%', height: SCENE_IMAGE_HEIGHT, borderRadius: 16 }}
          contentFit="cover"
          contentPosition="top"
          transition={300}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <View onLayout={(event) => onTextLayout(index, event.nativeEvent.layout.y)}>
        <SceneText
          lines={node.lines}
          text={node.text}
          size="recap"
          activeLine={activeLine}
          activeWord={activeWord}
          onLineLayout={(line, y, height) => onLineLayout(index, line, y, height)}
        />
      </View>

      {decision ? (
        <View
          className="flex-row items-start gap-2 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: palette.border }}
        >
          <CornerDownRight size={15} color={tone.color} />
          <Body weight="medium" className="flex-1 text-[15px] leading-6" color={tone.color}>
            {decision.choiceLabel}
          </Body>
        </View>
      ) : null}
    </View>
  );
}
