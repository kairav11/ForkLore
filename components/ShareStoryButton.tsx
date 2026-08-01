import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Share2 } from 'lucide-react-native';

import { shareStory } from '@/lib/share';
import { palette } from '@/lib/theme';

interface ShareStoryButtonProps {
  /** Story name, used in the message; null for an untitled story. */
  title: string | null;
  /** The story's share code — what a friend types on the enter screen. */
  code: string;
}

/** How long the tick stays up after a clipboard fallback. */
const CONFIRM_MS = 1800;

/**
 * Sends one story on: the native share sheet on a device, the browser's on the
 * web, and the clipboard when there is no sheet — the tick only appears in that
 * last case, because it is the only one the reader gets no system feedback for.
 */
export function ShareStoryButton({ title, code }: ShareStoryButtonProps) {
  const [isCopied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const press = () => {
    void shareStory({ title, code })
      .then((outcome) => {
        if (outcome !== 'copied') return;
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), CONFIRM_MS);
      })
      .catch(() => undefined);
  };

  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={`Share ${title ?? 'this story'}`}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{
          backgroundColor: isCopied ? palette.accentSoft : palette.surfaceRaised,
          borderWidth: 1,
          borderColor: isCopied ? palette.pathAEdge : palette.border,
        }}
      >
        {isCopied ? (
          <Check size={14} color={palette.accent} />
        ) : (
          <Share2 size={14} color={palette.accent} />
        )}
      </View>
    </Pressable>
  );
}
