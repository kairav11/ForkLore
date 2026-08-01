import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CornerDownRight, RotateCcw } from 'lucide-react-native';

import { findNode, useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette, pathTone } from '@/lib/theme';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { PathLine } from '@/components/PathLine';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { Body, Mono } from '@/components/ui/Text';

export default function ReplayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { story, error } = useEnsureStory(id);
  const decisions = useStoryStore((state) => state.decisions);
  const restart = useStoryStore((state) => state.restart);
  const endingNode = useCurrentNode();

  if (error) {
    return (
      <ErrorState
        title="We could not load the replay"
        message={error}
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }

  if (!story) {
    return <LoadingState title="Loading your replay…" />;
  }

  const takenPath = decisions.map((decision) =>
    decision.choiceLetter.toLowerCase() === 'a' ? 0 : 1,
  );

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl} overlay="strong">
      <View className="pt-safe-offset-2 flex-1">
        <View className="px-4">
          <ScreenHeader title="Your path" onBack={() => router.back()} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-safe-offset-6 gap-3 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4 pb-2">
            <Display className="text-[30px] leading-[36px]">
              {story.title ?? 'Your story, start to finish'}
            </Display>
            <Body className="text-muted text-[15px] leading-6">
              Every scene you read and every decision you made, in order.
            </Body>
            {takenPath.length > 0 ? (
              <PathLine total={Math.max(takenPath.length, 3)} choices={takenPath} />
            ) : null}
          </View>

          {decisions.map((decision, index) => {
            const node = findNode(story, decision.nodeId);
            const imageUrl = node?.imageUrl ?? null;
            const tone = pathTone(decision.choiceLetter.toLowerCase() === 'a' ? 0 : 1);

            return (
              <View
                key={`${decision.nodeId}-${decision.choiceLetter}`}
                className="gap-3 rounded-3xl p-4"
                style={{
                  backgroundColor: palette.panel,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Mono className="text-[10px] tracking-[2px] uppercase">
                    {`Scene ${index + 1}`}
                  </Mono>
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

                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: '100%', height: 180, borderRadius: 16 }}
                    contentFit="cover"
                    contentPosition="top"
                    transition={300}
                    cachePolicy="memory-disk"
                    accessibilityIgnoresInvertColors
                  />
                ) : null}

                <Body className="text-[16px] leading-[26px]">
                  {node?.text ?? decision.nodeText}
                </Body>

                <View
                  className="flex-row items-start gap-2 pt-3"
                  style={{ borderTopWidth: 1, borderTopColor: palette.border }}
                >
                  <CornerDownRight size={15} color={tone.color} />
                  <Body weight="medium" className="flex-1 text-[15px] leading-6" color={tone.color}>
                    {decision.choiceLabel}
                  </Body>
                </View>
              </View>
            );
          })}

          {decisions.length === 0 ? (
            <View
              className="gap-2 rounded-3xl p-5"
              style={{
                backgroundColor: palette.panel,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Body weight="medium" className="text-[16px] leading-6">
                There is no finished playthrough on this device yet.
              </Body>
              <Body className="text-muted text-[15px] leading-6">
                Read the story to the end and your decisions show up here.
              </Body>
            </View>
          ) : null}

          {endingNode?.isEnding ? (
            <View
              className="gap-3 rounded-3xl p-4"
              style={{
                backgroundColor: palette.panel,
                borderWidth: 1,
                borderColor: palette.pathAEdge,
              }}
            >
              <Mono className="text-[10px] tracking-[3px] uppercase" color={palette.accent}>
                The end
              </Mono>
              {endingNode.imageUrl ? (
                <Image
                  source={{ uri: endingNode.imageUrl }}
                  style={{ width: '100%', height: 180, borderRadius: 16 }}
                  contentFit="cover"
                  contentPosition="top"
                  transition={300}
                  cachePolicy="memory-disk"
                  accessibilityIgnoresInvertColors
                />
              ) : null}
              <Body className="text-[16px] leading-[26px]">{endingNode.text}</Body>
            </View>
          ) : null}

          <View className="pt-2">
            <ActionButton
              label="Read it again from the start"
              icon={RotateCcw}
              onPress={() => {
                restart();
                router.replace({ pathname: '/reader/[id]', params: { id } });
              }}
            />
          </View>
        </ScrollView>
      </View>
    </StoryBackdrop>
  );
}
