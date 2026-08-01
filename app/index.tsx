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
import { BookOpen, Check, KeyRound, Sparkles } from 'lucide-react-native';

import { errorMessage, generateIdea } from '@/lib/api';
import { SETTINGS, STYLES } from '@/lib/settings';
import { palette } from '@/lib/theme';
import type { SettingId, StyleId } from '@/lib/types';
import { FieldCard } from '@/components/FieldCard';
import { SettingPicker } from '@/components/SettingPicker';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { FieldInput } from '@/components/ui/FieldInput';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Body, Mono } from '@/components/ui/Text';

const HERO: number = require('@/assets/images/setup-hero.png');

/** A real sample of each treatment, so the choice is made by eye. */
const STYLE_PREVIEWS: Record<StyleId, number> = {
  'flat-illustrated': require('@/assets/images/style-flat.png'),
  'comic-ink': require('@/assets/images/style-comic.png'),
  painterly: require('@/assets/images/style-painterly.png'),
};

export default function SetupScreen() {
  const router = useRouter();
  const [setting, setSetting] = useState<SettingId | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isPromptFocused, setPromptFocused] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isNameFocused, setNameFocused] = useState(false);
  const [styleId, setStyleId] = useState<StyleId>('flat-illustrated');
  const [showErrors, setShowErrors] = useState(false);

  const missingSetting = setting === null;
  const settingHint = SETTINGS.find((option) => option.id === setting)?.hint;

  const handleStart = () => {
    if (missingSetting) {
      setShowErrors(true);
      return;
    }
    router.push({
      pathname: '/loading',
      params: {
        setting,
        style: styleId,
        prompt: prompt.trim(),
        name: name.trim(),
      },
    });
  };

  const suggestIdea = async () => {
    setIsThinking(true);
    setIdeaError(null);
    try {
      setPrompt(await generateIdea(setting, prompt.trim()));
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
          <FieldCard
            label="Where it happens"
            isActive={isPickerOpen}
            error={showErrors && missingSetting ? 'Pick a setting to continue.' : null}
            hint={settingHint ?? 'The backdrop and the ambient sound come from this place.'}
          >
            <SettingPicker
              value={setting}
              isOpen={isPickerOpen}
              onToggle={() => setPickerOpen(!isPickerOpen)}
              onSelect={(id) => {
                setSetting(id);
                setPickerOpen(false);
                if (showErrors) setShowErrors(false);
              }}
            />
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
                {prompt.trim().length === 0 ? 'Surprise me works too' : 'Your words'}
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
            <View className="flex-row gap-2.5">
              {STYLES.map((option) => {
                const isSelected = option.id === styleId;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setStyleId(option.id)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                    className="flex-1"
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View
                      className="gap-2 rounded-2xl p-2"
                      style={{
                        backgroundColor: palette.background,
                        borderWidth: 1,
                        borderColor: isSelected ? palette.accent : palette.border,
                      }}
                    >
                      <View className="w-full overflow-hidden rounded-xl">
                        <Image
                          source={STYLE_PREVIEWS[option.id]}
                          style={{ width: '100%', height: 92 }}
                          contentFit="cover"
                          contentPosition="center"
                          cachePolicy="memory-disk"
                          accessibilityIgnoresInvertColors
                        />
                        {isSelected ? (
                          <View className="absolute inset-0 items-center justify-center">
                            <View
                              className="h-7 w-7 items-center justify-center rounded-full"
                              style={{ backgroundColor: 'rgba(20, 21, 26, 0.75)' }}
                            >
                              <Check size={15} color={palette.accent} />
                            </View>
                          </View>
                        ) : null}
                      </View>
                      <Mono
                        className="text-center text-[9px] tracking-[1px] uppercase"
                        color={isSelected ? palette.accent : palette.muted}
                      >
                        {option.label}
                      </Mono>
                    </View>
                  </Pressable>
                );
              })}
            </View>
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
