import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BookOpen, Check, KeyRound } from 'lucide-react-native';

import { SETTINGS, STYLES } from '@/lib/settings';
import { fonts, palette } from '@/lib/theme';
import type { SettingId, StyleId } from '@/lib/types';
import { FieldCard } from '@/components/FieldCard';
import { SettingPicker } from '@/components/SettingPicker';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Body, Mono } from '@/components/ui/Text';

const HERO: number = require('@/assets/images/setup-hero.png');

/** Previews are built from the app's own two path tones, never stock colours. */
const STYLE_SWATCHES: Record<StyleId, readonly [string, string]> = {
  'flat-illustrated': [palette.pathA, palette.pathB],
  'comic-ink': [palette.foreground, palette.surfaceRaised],
  painterly: [palette.pathB, palette.pathA],
};

export default function SetupScreen() {
  const router = useRouter();
  const [setting, setSetting] = useState<SettingId | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isPromptFocused, setPromptFocused] = useState(false);
  const [name, setName] = useState('');
  const [isNameFocused, setNameFocused] = useState(false);
  const [styleId, setStyleId] = useState<StyleId>('flat-illustrated');
  const [showErrors, setShowErrors] = useState(false);

  const missingSetting = setting === null;
  const missingPrompt = prompt.trim().length === 0;
  const settingHint = SETTINGS.find((option) => option.id === setting)?.hint;

  const handleStart = () => {
    if (missingSetting || missingPrompt) {
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
              <Mono className="pl-1 text-[10px] tracking-[3px] uppercase">StoryBranch</Mono>
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
            label="Your story idea"
            isActive={isPromptFocused}
            error={
              showErrors && missingPrompt
                ? 'Add a sentence or two so we know where to start.'
                : null
            }
            hint="A sentence is enough. More detail means a closer match."
          >
            <TextInput
              value={prompt}
              onChangeText={(text) => {
                setPrompt(text);
                if (showErrors) setShowErrors(false);
              }}
              onFocus={() => setPromptFocused(true)}
              onBlur={() => setPromptFocused(false)}
              placeholder="A quiet kid finds a note in their locker that knows their secret…"
              placeholderTextColor={palette.placeholder}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 104,
                fontFamily: fonts.body,
                fontSize: 17,
                lineHeight: 26,
                color: palette.foreground,
              }}
            />
          </FieldCard>

          <FieldCard label="Art style">
            <View className="flex-row gap-2.5">
              {STYLES.map((option) => {
                const isSelected = option.id === styleId;
                const swatch = STYLE_SWATCHES[option.id];
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
                      <View className="h-14 w-full overflow-hidden rounded-xl">
                        <LinearGradient
                          colors={[swatch[0], swatch[1]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: '100%', height: '100%' }}
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
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="e.g. Mia"
              placeholderTextColor={palette.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              style={{
                height: 30,
                fontFamily: fonts.body,
                fontSize: 17,
                color: palette.foreground,
              }}
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
