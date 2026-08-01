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
import { useSceneMedia } from '@/hooks/useSceneMedia';
import { ChoiceButton } from '@/components/ChoiceButton';
import { MediaHint } from '@/components/MediaHint';
import { SceneProgress } from '@/components/SceneProgress';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';

const DECISIONS_PER_STORY = 3;

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
  const { isPaintingScene, isRecordingNarration } = useSceneMedia(story, shownNode);

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
    return <LoadingState title="Opening your story…" />;
  }

  const choices = shownNode.choices.slice(0, 2);
  const sceneLabel =
    playMode === 'shared' && story.ownerName
      ? `${story.ownerName}'s story`
      : (story.title ?? 'Your story');

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl}>
      {shownNode.imageUrl ? (
        <AnimatedView
          pointerEvents="none"
          style={[
            crossfadeStyle,
            { position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.68 },
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
        <View className="flex-row items-start justify-between">
          <View
            className="gap-2 rounded-2xl px-3 py-2"
            style={{ backgroundColor: 'rgba(13, 10, 6, 0.55)' }}
          >
            <Text numberOfLines={1} className="text-foreground max-w-[190px] text-sm font-semibold">
              {sceneLabel}
            </Text>
            <SceneProgress total={DECISIONS_PER_STORY} made={decisions.length} />
          </View>

          <View className="flex-row items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-10 w-10 rounded-full px-0"
              style={{ backgroundColor: 'rgba(13, 10, 6, 0.55)' }}
              accessibilityLabel={ambientEnabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
              onPress={() => setAmbientEnabled(!ambientEnabled)}
            >
              {ambientEnabled ? (
                <Volume2 size={18} color={palette.foreground} />
              ) : (
                <VolumeX size={18} color={palette.muted} />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-10 w-10 rounded-full px-0"
              style={{ backgroundColor: 'rgba(13, 10, 6, 0.55)' }}
              accessibilityLabel="Leave story"
              onPress={() => {
                narration.stop();
                clear();
                router.replace('/');
              }}
            >
              <X size={18} color={palette.foreground} />
            </Button>
          </View>
        </View>

        <View className="flex-1" />

        <AnimatedView style={crossfadeStyle} className="gap-5">
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="bg-accent h-[2px] w-7 rounded-full" />
              <Text className="text-accent text-[11px] font-bold tracking-[3px] uppercase">
                Scene {decisions.length + 1}
              </Text>
            </View>

            <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
              <Text className="text-foreground text-xl leading-8">{shownNode.text}</Text>
            </ScrollView>

            {narration.hasAudio ? (
              <Button
                size="sm"
                variant="tertiary"
                className="border-accent/35 h-11 self-start rounded-full border px-4"
                onPress={narration.toggle}
              >
                {narration.isPlaying ? (
                  <Pause size={16} color={palette.accent} />
                ) : (
                  <Play size={16} color={palette.accent} />
                )}
                <Button.Label className="text-accent text-sm font-semibold">
                  {narration.isPlaying ? 'Pause narration' : 'Listen'}
                </Button.Label>
              </Button>
            ) : isRecordingNarration ? (
              <MediaHint kind="voice" />
            ) : null}

            {isPaintingScene ? <MediaHint kind="art" /> : null}
          </View>

          <View className="gap-3">
            {choices.map((choice, index) => (
              <ChoiceButton
                key={`${shownNode.id}-${choice.letter}`}
                letter={choice.letter}
                label={choice.label}
                emphasis={index === 0 ? 'primary' : 'secondary'}
                onPress={() => {
                  narration.stop();
                  choose(index);
                }}
              />
            ))}
          </View>
        </AnimatedView>
      </View>
    </StoryBackdrop>
  );
}
