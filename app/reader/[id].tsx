import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, RefreshCw, Volume2, VolumeX, X } from 'lucide-react-native';

import { findNode, hasScene, useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { PlayMode } from '@/lib/types';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useNarration } from '@/hooks/useNarration';
import { useSceneBranches } from '@/hooks/useSceneBranches';
import { useSceneMedia } from '@/hooks/useSceneMedia';
import { ChoiceButton } from '@/components/ChoiceButton';
import { MediaHint } from '@/components/MediaHint';
import { NarrationPill } from '@/components/NarrationPill';
import { PathLine } from '@/components/PathLine';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Body, Mono } from '@/components/ui/Text';

const DECISIONS_PER_STORY = 3;
const PEEK_MS = 220;

export default function ReaderScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: PlayMode }>();
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
  const branches = useSceneBranches(story, shownNode);

  /** Decisions so far as option indexes, for the branching-path indicator. */
  const takenPath = useMemo(
    () => decisions.map((decision) => (decision.choiceLetter.toLowerCase() === 'a' ? 0 : 1)),
    [decisions],
  );

  // Peeking fades the reading panel away so the scene art can be looked at.
  const [isPeeking, setIsPeeking] = useState(false);
  const peek = useSharedValue(1);
  useEffect(() => {
    peek.set(withTiming(isPeeking ? 0 : 1, { duration: PEEK_MS }));
  }, [isPeeking, peek]);
  const peekStyle = useAnimatedStyle(() => ({ opacity: peek.get() }));

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
    <StoryBackdrop
      imageUrl={story.backgroundImageUrl}
      underlay={
        shownNode.imageUrl ? (
          <AnimatedView
            pointerEvents="none"
            style={[crossfadeStyle, StyleSheet.absoluteFillObject]}
          >
            <Image
              source={{ uri: shownNode.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              contentPosition="center"
              transition={420}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          </AnimatedView>
        ) : null
      }
    >
      <View className="pt-safe-offset-2 pb-safe-offset-3 flex-1 px-4">
        <View className="flex-row items-start justify-between gap-3">
          <AnimatedView
            pointerEvents="none"
            style={[peekStyle, { backgroundColor: palette.panelReading }]}
            className="gap-2.5 rounded-2xl px-3.5 py-3"
          >
            <Mono className="text-[10px] tracking-[2px] uppercase">
              {`Decision ${Math.min(decisions.length + 1, DECISIONS_PER_STORY)} of ${DECISIONS_PER_STORY}`}
            </Mono>
            <PathLine total={DECISIONS_PER_STORY} choices={takenPath} />
          </AnimatedView>

          <View className="flex-row items-center gap-2">
            <IconButton
              accessibilityLabel={
                isPeeking ? 'Show the story text' : 'Hide the text to see the art'
              }
              onPress={() => setIsPeeking(!isPeeking)}
            >
              {isPeeking ? (
                <Eye size={17} color={palette.accent} />
              ) : (
                <EyeOff size={17} color={palette.foreground} />
              )}
            </IconButton>
            <IconButton
              accessibilityLabel={ambientEnabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
              onPress={() => setAmbientEnabled(!ambientEnabled)}
            >
              {ambientEnabled ? (
                <Volume2 size={17} color={palette.foreground} />
              ) : (
                <VolumeX size={17} color={palette.muted} />
              )}
            </IconButton>
            <IconButton
              accessibilityLabel="Leave story"
              onPress={() => {
                narration.stop();
                clear();
                router.replace('/');
              }}
            >
              <X size={17} color={palette.foreground} />
            </IconButton>
          </View>
        </View>

        <View className="flex-1" />

        <AnimatedView
          style={peekStyle}
          pointerEvents={isPeeking ? 'none' : 'auto'}
          className="gap-3.5"
        >
          <AnimatedView style={crossfadeStyle} className="gap-3.5">
            {/* Translucent charcoal panel, borderless: the story reads cleanly and
                the artwork behind it stays legible as artwork. */}
            <View
              className="gap-3.5 rounded-3xl px-5 py-4"
              style={{ backgroundColor: palette.panelReading }}
            >
              <Display weight="medium" className="text-muted text-[14px] leading-5">
                {sceneLabel}
              </Display>

              <ScrollView className="max-h-44" showsVerticalScrollIndicator={false}>
                <Body className="text-[17px] leading-[27px]">{shownNode.text}</Body>
              </ScrollView>

              {narration.hasAudio ? (
                <NarrationPill isPlaying={narration.isPlaying} onPress={narration.toggle} />
              ) : isRecordingNarration ? (
                <MediaHint kind="voice" />
              ) : null}

              {isPaintingScene ? <MediaHint kind="art" /> : null}
              {branches.isWriting ? <MediaHint kind="writing" /> : null}
            </View>

            <View className="gap-2.5">
              {choices.map((choice, index) => (
                <ChoiceButton
                  key={`${shownNode.id}-${choice.letter}`}
                  letter={choice.letter}
                  label={choice.label}
                  index={index}
                  // Each option unlocks as soon as its own scene exists, so a
                  // half-written pair still lets the reader move on.
                  disabled={!choice.nextNodeId || !hasScene(story, choice.nextNodeId)}
                  onPress={() => {
                    narration.stop();
                    choose(index);
                  }}
                />
              ))}

              {branches.error && !branches.isReady ? (
                <View className="gap-2 pt-1">
                  <Body className="text-muted text-[13px] leading-5">{branches.error}</Body>
                  <ActionButton
                    label="Write the next scenes"
                    variant="secondary"
                    icon={RefreshCw}
                    onPress={branches.retry}
                  />
                </View>
              ) : null}
            </View>
          </AnimatedView>
        </AnimatedView>
      </View>
    </StoryBackdrop>
  );
}
