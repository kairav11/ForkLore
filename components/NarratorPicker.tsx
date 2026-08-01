import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Check, Pause, Play, Volume2 } from 'lucide-react-native';

import { fetchNarratorPreviews } from '@/lib/api';
import { palette } from '@/lib/theme';
import { NARRATORS, type NarratorOption } from '@/lib/voices';
import { Body, Mono } from '@/components/ui/Text';

interface NarratorPickerProps {
  value: string;
  onSelect: (option: NarratorOption) => void;
}

/**
 * A demo that starts right after a source swap is still the previous voice for a
 * moment, so a finish reported inside this window is ignored — the same guard the
 * reader's narration uses.
 */
const GRACE_MS = 400;

/**
 * Demo urls, once resolved, for the life of the app session: they are the same
 * for everyone and take a moment to warm up the first time.
 */
let cachedPreviews: Record<string, string> | null = null;

/**
 * Four narrators, each a card that both picks the voice and plays its demo line.
 * One tap does both on purpose: comparing the voices *is* choosing between them,
 * and a separate play button inside a selectable card swallows the card's press.
 */
export function NarratorPicker({ value, onSelect }: NarratorPickerProps) {
  const [previews, setPreviews] = useState<Record<string, string>>(cachedPreviews ?? {});
  const [isLoadingPreviews, setLoadingPreviews] = useState(cachedPreviews === null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const player = useAudioPlayer(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (cachedPreviews !== null) return undefined;
    let cancelled = false;

    fetchNarratorPreviews(NARRATORS)
      .then((result) => {
        cachedPreviews = result;
        if (!cancelled) setPreviews(result);
      })
      .catch(() => {
        if (!cancelled) setPreviews({});
      })
      .finally(() => {
        if (!cancelled) setLoadingPreviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      if (Date.now() - startedAt.current < GRACE_MS) return;
      setPlayingId(null);
    });
    return () => subscription.remove();
  }, [player]);

  const handlePress = useCallback(
    (option: NarratorOption) => {
      const wasSelected = option.id === value;
      onSelect(option);

      const url = previews[option.id];
      if (!url) return;

      if (wasSelected && playingId === option.id) {
        player.pause();
        setPlayingId(null);
        return;
      }

      startedAt.current = Date.now();
      player.replace({ uri: url });
      player.play();
      setPlayingId(option.id);
    },
    [onSelect, player, playingId, previews, value],
  );

  return (
    <View className="gap-2.5">
      <View className="flex-row flex-wrap gap-2.5">
        {NARRATORS.map((option) => {
          const isSelected = option.id === value;
          const isPlaying = playingId === option.id;
          const hasDemo = Boolean(previews[option.id]);

          return (
            <Pressable
              key={option.id}
              onPress={() => handlePress(option)}
              accessibilityRole="button"
              accessibilityLabel={`${option.name}, ${option.blurb}. Select and hear a sample.`}
              accessibilityState={{ selected: isSelected }}
              className="min-w-[46%] flex-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <View
                className="gap-1.5 rounded-2xl px-3 py-3"
                style={{
                  backgroundColor: isSelected ? palette.accentSoft : palette.background,
                  borderWidth: 1,
                  borderColor: isSelected ? palette.accent : palette.border,
                }}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isPlaying ? palette.accent : palette.surfaceRaised,
                    }}
                  >
                    {isPlaying ? (
                      <Pause size={13} color={palette.accentForeground} />
                    ) : hasDemo ? (
                      <Play size={13} color={isSelected ? palette.accent : palette.foreground} />
                    ) : (
                      <Volume2 size={13} color={palette.placeholder} />
                    )}
                  </View>
                  <Body
                    weight="medium"
                    className="flex-1 text-[15px]"
                    color={isSelected ? palette.accent : palette.foreground}
                  >
                    {option.name}
                  </Body>
                  {isSelected ? <Check size={14} color={palette.accent} /> : null}
                </View>
                <Mono className="text-[9px] leading-[13px] tracking-[1px] uppercase">
                  {option.blurb}
                </Mono>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center gap-2">
        {isLoadingPreviews ? <ActivityIndicator size="small" color={palette.muted} /> : null}
        <Mono className="text-[9px] tracking-[2px] uppercase">
          {isLoadingPreviews
            ? 'Loading samples'
            : playingId
              ? 'Playing sample'
              : Object.keys(previews).length === 0
                ? 'Samples unavailable — pick by name'
                : 'Tap a voice to hear it'}
        </Mono>
      </View>
    </View>
  );
}
