import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { palette } from '@/lib/theme';
import type { StoryLine } from '@/lib/types';
import { SceneText } from '@/components/SceneText';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Mono } from '@/components/ui/Text';

interface ReadingPanelProps {
  lines: StoryLine[];
  text: string;
  /** Height the text is clipped to before the reader expands it. */
  collapsedHeight?: number;
  expandedHeight?: number;
  size?: 'reader' | 'ending';
  /** Sits above the text — a label or a title. */
  header?: ReactNode;
  /** Sits below the toggle — the narration pill and generation hints. */
  footer?: ReactNode;
}

const FADE_HEIGHT = 34;

/**
 * The band of story text over the scene art.
 *
 * It is deliberately light: a translucent charcoal wash rather than a card, and
 * only a few lines tall until the reader asks for the rest. The artwork is the
 * screen; this is a caption on top of it. Mount it with a key per scene so the
 * expanded state resets when the scene changes.
 */
export function ReadingPanel({
  lines,
  text,
  collapsedHeight = 120,
  expandedHeight = 300,
  size = 'reader',
  header,
  footer,
}: ReadingPanelProps) {
  const [isExpanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const overflows = contentHeight > collapsedHeight + 6;
  const maxHeight = isExpanded ? expandedHeight : collapsedHeight;

  return (
    <View className="gap-3 rounded-3xl px-5 py-4" style={{ backgroundColor: palette.panelScene }}>
      {header}

      <View>
        <ScrollView
          style={{ maxHeight }}
          scrollEnabled={isExpanded}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_width, height) => setContentHeight(height)}
        >
          <SceneText lines={lines} text={text} size={size} />
        </ScrollView>

        {overflows && !isExpanded ? (
          <LinearGradient
            pointerEvents="none"
            colors={[palette.panelFade, palette.panelFadeStrong]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE_HEIGHT }}
          />
        ) : null}
      </View>

      {overflows ? (
        <Pressable
          onPress={() => setExpanded(!isExpanded)}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Collapse the story text' : 'Read the whole scene'}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'flex-start' })}
        >
          <View className="flex-row items-center gap-1.5">
            {isExpanded ? (
              <ChevronUp size={12} color={palette.accent} />
            ) : (
              <ChevronDown size={12} color={palette.accent} />
            )}
            <Mono className="text-[9px] tracking-[2px] uppercase" color={palette.accent}>
              {isExpanded ? 'Show less' : 'Read all'}
            </Mono>
          </View>
        </Pressable>
      ) : null}

      {footer}
    </View>
  );
}
