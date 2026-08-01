import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BookOpen, KeyRound, Sparkles } from 'lucide-react-native';

import { errorMessage, generateIdea } from '@/lib/api';
import type { PlaceOption } from '@/lib/places';
import { palette } from '@/lib/theme';
import type { ThemeOption } from '@/lib/themes';
import type { StyleId } from '@/lib/types';
import { NARRATORS, type NarratorOption } from '@/lib/voices';
import { FieldCard } from '@/components/FieldCard';
import { NarratorPicker } from '@/components/NarratorPicker';
import { SettingPicker } from '@/components/SettingPicker';
import { StoryLibrary } from '@/components/StoryLibrary';
import { StylePicker } from '@/components/StylePicker';
import { ThemePicker } from '@/components/ThemePicker';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { FieldInput } from '@/components/ui/FieldInput';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Body, Mono } from '@/components/ui/Text';

const HERO: number = require('@/assets/images/setup-hero.png');

export default function SetupScreen() {
  const router = useRouter();
  const [place, setPlace] = useState<PlaceOption | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isPromptFocused, setPromptFocused] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeOption | null>(null);
  const [name, setName] = useState('');
  const [isNameFocused, setNameFocused] = useState(false);
  const [styleId, setStyleId] = useState<StyleId>('flat-illustrated');
  const [narrator, setNarrator] = useState<NarratorOption>(NARRATORS[0]);
  const [showErrors, setShowErrors] = useState(false);

  const missingSetting = place === null;

  const handleStart = () => {
    if (!place) {
      setShowErrors(true);
      return;
    }
    router.push({
      pathname: '/loading',
      params: {
        setting: place.id,
        settingLabel: place.label,
        style: styleId,
        theme: theme?.id ?? '',
        prompt: prompt.trim(),
        name: name.trim(),
        voice: narrator.id,
        voiceName: narrator.name,
      },
    });
  };

  const suggestIdea = async () => {
    setIsThinking(true);
    setIdeaError(null);
    try {
      setPrompt(
        await generateIdea({
          settingId: place?.id ?? null,
          settingLabel: place?.label ?? '',
          themeId: theme?.id ?? null,
          avoid: prompt.trim(),
        }),
      );
    } catch (cause) {
      setIdeaError(errorMessage(cause));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-[320px] w-full">
          <Image
            source={HERO}
            style={{ width: '100%', height: 320 }}
            contentFit="cover"
            contentPosition="center"
            accessibilityIgnoresInvertColors
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(20, 21, 26, 0.5)',
            }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[palette.scrimSoft, palette.scrim, palette.background]}
            locations={[0, 0.6, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="pt-safe-offset-5 absolute inset-x-0 bottom-0 justify-end px-5 pb-7">
            <View className="flex-row items-center gap-2.5 pb-4">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.pathA }} />
              <View className="h-[2px] w-4" style={{ backgroundColor: palette.borderStrong }} />
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.pathB }} />
              <Mono className="pl-1 text-[10px] tracking-[3px] uppercase">ForkLore</Mono>
            </View>
            <Display className="text-[40px] leading-[46px]">
              Write the start.{'\n'}Choose the rest.
            </Display>
            <Body className="text-muted mt-3 text-[15px] leading-6">
              One place, your idea, three decisions — and an ending that is yours alone.
            </Body>
          </View>
        </View>

        <View className="gap-3 px-5 pt-6">
          <StoryLibrary />

          <FieldCard
            label="Where it happens"
            isActive={isPickerOpen}
            error={showErrors && missingSetting ? 'Pick a setting to continue.' : null}
            hint={
              place?.hint && place.hint.length > 0
                ? place.hint
                : 'The backdrop and the ambient sound come from this place. Add your own if it is missing.'
            }
          >
            <SettingPicker
              value={place?.id ?? null}
              isOpen={isPickerOpen}
              onToggle={() => setPickerOpen(!isPickerOpen)}
              onSelect={(next) => {
                setPlace(next);
                setPickerOpen(false);
                if (showErrors) setShowErrors(false);
              }}
            />
          </FieldCard>

          <FieldCard
            label="Mood — optional"
            hint={
              theme
                ? `${theme.hint} Tap it again to clear.`
                : 'Pick one and both the suggested ideas and the writing follow it.'
            }
          >
            <ThemePicker value={theme?.id ?? null} onSelect={setTheme} />
          </FieldCard>

          <FieldCard
            label="Your story idea — optional"
            isActive={isPromptFocused}
            error={ideaError}
            hint="Leave it empty and we invent the premise, or tap the spark for one to edit."
          >
            <FieldInput
              value={prompt}
              onChangeText={(text) => {
                setPrompt(text);
                if (ideaError) setIdeaError(null);
              }}
              onFocus={() => setPromptFocused(true)}
              onBlur={() => setPromptFocused(false)}
              placeholder="A quiet kid finds a note in their locker that knows their secret…"
              multiline
              minHeight={96}
            />

            <View className="flex-row items-center justify-between">
              <Mono className="text-[9px] tracking-[2px] uppercase">
                {prompt.trim().length > 0
                  ? 'Your words'
                  : theme
                    ? `${theme.label} · surprise me works too`
                    : 'Surprise me works too'}
              </Mono>

              <Pressable
                onPress={() => void suggestIdea()}
                disabled={isThinking}
                accessibilityRole="button"
                accessibilityLabel="Suggest a story idea"
                accessibilityState={{ disabled: isThinking }}
                style={({ pressed }) => ({ opacity: isThinking ? 0.6 : pressed ? 0.8 : 1 })}
              >
                <View
                  className="h-9 flex-row items-center gap-2 rounded-full px-3.5"
                  style={{
                    backgroundColor: palette.accentSoft,
                    borderWidth: 1,
                    borderColor: palette.pathAEdge,
                  }}
                >
                  {isThinking ? (
                    <ActivityIndicator size="small" color={palette.accent} />
                  ) : (
                    <Sparkles size={13} color={palette.accent} />
                  )}
                  <Mono className="text-[10px] tracking-[2px] uppercase" color={palette.accent}>
                    {isThinking
                      ? 'Thinking'
                      : prompt.trim().length === 0
                        ? 'Give me one'
                        : 'Another'}
                  </Mono>
                </View>
              </Pressable>
            </View>
          </FieldCard>

          <FieldCard label="Art style" hint="Every scene in your story is drawn this way.">
            <StylePicker value={styleId} onSelect={setStyleId} />
          </FieldCard>

          <FieldCard
            label="Narrator"
            hint="This voice reads every scene. Characters who speak get their own."
          >
            <NarratorPicker value={narrator.id} onSelect={setNarrator} />
          </FieldCard>

          <FieldCard
            label="Your name (optional)"
            isActive={isNameFocused}
            hint="Friends see this on their match score."
          >
            <FieldInput
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="e.g. Mia"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </FieldCard>
        </View>
      </ScrollView>

      <View className="pb-safe-offset-4 gap-1 px-5 pt-3">
        <LinearGradient
          pointerEvents="none"
          colors={[palette.transparent, palette.background]}
          style={{ position: 'absolute', left: 0, right: 0, top: -28, height: 28 }}
        />
        <ActionButton label="Start my story" icon={BookOpen} onPress={handleStart} />
        <ActionButton
          label="Enter a shared story"
          variant="ghost"
          icon={KeyRound}
          onPress={() => router.push('/enter')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
