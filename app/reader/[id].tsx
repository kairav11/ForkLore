import { useEffect, useMemo } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react-native';

import { findNode, useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { PlayMode } from '@/lib/types';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useNarration } from '@/hooks/useNarration';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';

export default function ReaderScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: PlayMode }>();
  const { height } = useWindowDimensions();

  const { story, error } = useEnsureStory(id, mode ?? 'owner');
  const playMode = useStoryStore((state) => state.mode);
  const decisions = useStoryStore((state) => state.decisions);
  const ambientEnabled = useStoryStore((state) => state.ambientEnabled);
  const setAmbientEnabled = useStoryStore((state) => state.setAmbientEnabled);
  const choose = useStoryStore((state) => state.choose);
  const clear = useStoryStore((state) => state.clear);

  const node = useCurrentNode();

  // Reaching a node without choices means the story is over.
  useEffect(() => {
    if (node?.isEnding && id) {
      router.replace({ pathname: '/ending/[id]', params: { id } });
    }
  }, [node?.isEnding, id, router]);

  const { shown: shownNodeId, style: crossfadeStyle } = useCrossfade(node?.id ?? null);
  const shownNode = story && shownNodeId ? findNode(story, shownNodeId) : null;
  const audioUrls = useMemo(() => shownNode?.audioUrls ?? [], [shownNode]);
  const narration = useNarration(audioUrls);

  if (error) {
    return (
      <ErrorState
        title="This story would not open"
        message={error}
        actionLabel="Back to setup"
        onAction={() => {
          clear();
          router.replace('/');
        }}
      />
    );
  }

  if (!story || !shownNode) {
    return <LoadingState title="Opening your story..." />;
  }

  const choices = shownNode.choices.slice(0, 2);

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl}>
      {shownNode.imageUrl ? (
        <AnimatedView
          pointerEvents="none"
          style={[
            crossfadeStyle,
            { position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.66 },
          ]}
        >
          <Image
            source={{ uri: shownNode.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            contentPosition="bottom"
            transition={420}
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
        </AnimatedView>
      ) : null}

      <View className="pt-safe-offset-2 pb-safe-offset-4 flex-1 px-5">
        <View className="flex-row items-center justify-between">
          <View className="bg-background/60 rounded-full px-3 py-1.5">
            <Text className="text-muted text-sm font-semibold tracking-wide">
              {playMode === 'shared' && story.ownerName
                ? `${story.ownerName}'s story · Scene ${decisions.length + 1}`
                : `Scene ${decisions.length + 1}`}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-11 w-11 px-0"
              accessibilityLabel={ambientEnabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
              onPress={() => setAmbientEnabled(!ambientEnabled)}
            >
              {ambientEnabled ? (
                <Volume2 size={20} color={palette.foreground} />
              ) : (
                <VolumeX size={20} color={palette.muted} />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-11 w-11 px-0"
              accessibilityLabel="Leave story"
              onPress={() => {
                narration.stop();
                clear();
                router.replace('/');
              }}
            >
              <X size={20} color={palette.foreground} />
            </Button>
          </View>
        </View>

        <View className="flex-1" />

        <AnimatedView style={crossfadeStyle} className="gap-4">
          <View className="bg-background/85 border-border/60 rounded-3xl border p-5">
            <ScrollView className="max-h-56" showsVerticalScrollIndicator={false}>
              <Text className="text-foreground text-xl leading-8">{shownNode.text}</Text>
            </ScrollView>

            {narration.hasAudio ? (
              <Button
                size="md"
                variant="tertiary"
                className="mt-4 self-start"
                onPress={narration.toggle}
              >
                {narration.isPlaying ? (
                  <Pause size={18} color={palette.accent} />
                ) : (
                  <Play size={18} color={palette.accent} />
                )}
                <Button.Label className="text-base">
                  {narration.isPlaying ? 'Pause narration' : 'Play narration'}
                </Button.Label>
              </Button>
            ) : null}
          </View>

          <View className="gap-3">
            {choices.map((choice, index) => (
              <Button
                key={`${shownNode.id}-${choice.letter}`}
                size="lg"
                variant={index === 0 ? 'primary' : 'secondary'}
                className="h-auto min-h-14 py-4"
                onPress={() => {
                  narration.stop();
                  choose(index);
                }}
              >
                <Button.Label className="text-center text-lg leading-6">
                  {choice.label}
                </Button.Label>
              </Button>
            ))}
          </View>
        </AnimatedView>
      </View>
    </StoryBackdrop>
  );
}
