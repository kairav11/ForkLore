import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Copy, Link2, Share2 } from 'lucide-react-native';

import { shareCodeFor, shareLinkFor, shareStory } from '@/lib/share';
import { palette } from '@/lib/theme';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { GlowBackground } from '@/components/GlowBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { Body, Mono } from '@/components/ui/Text';

type CopyTarget = 'code' | 'link' | null;

interface CopyPillProps {
  label: string;
  isCopied: boolean;
  icon: 'code' | 'link';
  onPress: () => void;
}

function CopyPill({ label, isCopied, icon, onPress }: CopyPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, alignSelf: 'flex-start' })}
    >
      <View
        className="h-10 flex-row items-center gap-2 rounded-full px-4"
        style={{
          backgroundColor: palette.surfaceRaised,
          borderWidth: 1,
          borderColor: palette.border,
        }}
      >
        {isCopied ? (
          <Check size={14} color={palette.accent} />
        ) : icon === 'code' ? (
          <Copy size={14} color={palette.foreground} />
        ) : (
          <Link2 size={14} color={palette.foreground} />
        )}
        <Mono
          className="text-[10px] tracking-[2px] uppercase"
          color={isCopied ? palette.accent : palette.foreground}
        >
          {label}
        </Mono>
      </View>
    </Pressable>
  );
}

export default function ShareScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { story, error } = useEnsureStory(id);
  const [copied, setCopied] = useState<CopyTarget>(null);

  if (error) {
    return (
      <ErrorState
        title="We could not build a share code"
        message={error}
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }

  if (!story) {
    return <LoadingState title="Preparing your share code…" />;
  }

  const code = shareCodeFor(story);
  const link = shareLinkFor(story);
  const codeTiles = code.split('').map((character, index) => ({
    id: `${index}-${character}`,
    character,
  }));

  const copy = async (target: Exclude<CopyTarget, null>) => {
    await Clipboard.setStringAsync(target === 'code' ? code : link);
    setCopied(target);
  };

  const openShareSheet = async () => {
    const outcome = await shareStory({ title: story.title, code });
    // On the web there may be no share sheet; the message lands on the clipboard instead.
    if (outcome === 'copied') setCopied('link');
  };

  return (
    <GlowBackground>
      <View className="pt-safe-offset-2 pb-safe-offset-5 flex-1 px-5">
        <ScreenHeader title="Share" onBack={() => router.back()} />

        <View className="flex-1 justify-center gap-8">
          <View className="gap-3">
            <Display className="text-[34px] leading-[40px]">Send it to a friend</Display>
            <Body className="text-muted text-[15px] leading-7">
              They read the same story and make their own decisions. When they finish, you both see
              how closely you matched.
            </Body>
          </View>

          <View className="items-center gap-4">
            <Mono className="text-[10px] tracking-[3px] uppercase">Story code</Mono>
            <View className="flex-row gap-2">
              {codeTiles.map((tile) => (
                <View
                  key={tile.id}
                  className="h-14 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: palette.accentSoft,
                    borderWidth: 1,
                    borderColor: palette.pathAEdge,
                  }}
                >
                  <Mono weight="bold" className="text-[22px]" color={palette.accent}>
                    {tile.character}
                  </Mono>
                </View>
              ))}
            </View>
            <CopyPill
              icon="code"
              isCopied={copied === 'code'}
              label={copied === 'code' ? 'Code copied' : 'Copy code'}
              onPress={() => void copy('code')}
            />
          </View>

          <View
            className="gap-3 rounded-3xl p-5"
            style={{
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Mono className="text-[10px] tracking-[3px] uppercase">Story link</Mono>
            <Body selectable className="text-[15px] leading-6">
              {link}
            </Body>
            <CopyPill
              icon="link"
              isCopied={copied === 'link'}
              label={copied === 'link' ? 'Link copied' : 'Copy link'}
              onPress={() => void copy('link')}
            />
          </View>
        </View>

        <ActionButton
          label="Share this story"
          icon={Share2}
          onPress={() => void openShareSheet()}
        />
      </View>
    </GlowBackground>
  );
}
