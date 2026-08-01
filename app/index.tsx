import { Fragment, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  Select,
  Separator,
  Text,
  TextArea,
  TextField,
} from 'heroui-native';
import { BookOpen, Check, KeyRound, Sparkles } from 'lucide-react-native';

import { SETTINGS, STYLES } from '@/lib/settings';
import { palette } from '@/lib/theme';
import type { StyleId } from '@/lib/types';
import { Display } from '@/components/ui/Display';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';

interface SelectValue {
  value: string;
  label: string;
}

const HERO: number = require('@/assets/images/setup-hero.png');

const STYLE_SWATCHES: Record<StyleId, readonly [string, string]> = {
  'flat-illustrated': ['#F7C777', '#E0714A'],
  'comic-ink': ['#EDE7DA', '#40382F'],
  painterly: ['#C97B4A', '#5A3A58'],
};

export default function SetupScreen() {
  const router = useRouter();
  const [setting, setSetting] = useState<SelectValue | undefined>();
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [styleId, setStyleId] = useState<StyleId>('flat-illustrated');
  const [showErrors, setShowErrors] = useState(false);

  const missingSetting = setting === undefined;
  const missingPrompt = prompt.trim().length === 0;
  const settingHint = SETTINGS.find((option) => option.id === setting?.value)?.hint;

  const handleStart = () => {
    if (missingSetting || missingPrompt) {
      setShowErrors(true);
      return;
    }
    router.push({
      pathname: '/loading',
      params: {
        setting: setting.value,
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
        <View className="h-[330px] w-full">
          <Image
            source={HERO}
            style={{ width: '100%', height: 330 }}
            contentFit="cover"
            contentPosition="center"
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            pointerEvents="none"
            colors={[palette.scrimSoft, palette.scrim, palette.background]}
            locations={[0, 0.55, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="pt-safe-offset-5 absolute inset-x-0 bottom-0 justify-end px-6 pb-6">
            <View className="flex-row items-center gap-2 pb-3">
              <Sparkles size={16} color={palette.accent} />
              <Text className="text-accent text-[11px] font-bold tracking-[4px] uppercase">
                StoryBranch
              </Text>
            </View>
            <Display className="text-[38px] leading-[44px]">
              Write the start.{'\n'}Choose the rest.
            </Display>
            <Text className="text-muted mt-3 text-base leading-6">
              One place, your idea, three decisions — and an ending that is yours alone.
            </Text>
          </View>
        </View>

        <View className="gap-7 px-6 pt-7">
          <TextField isInvalid={showErrors && missingSetting}>
            <Label className="text-base">Where does it happen?</Label>
            <Select value={setting} onValueChange={setSetting}>
              <Select.Trigger className="h-14 rounded-2xl">
                <Select.Value placeholder="Choose a setting" className="text-lg" />
                <Select.TriggerIndicator />
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                  {SETTINGS.map((option, index) => (
                    <Fragment key={option.id}>
                      <Select.Item value={option.id} label={option.label} />
                      {index < SETTINGS.length - 1 ? <Separator /> : null}
                    </Fragment>
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>
            {showErrors && missingSetting ? (
              <FieldError>Pick a setting to continue.</FieldError>
            ) : (
              <Description>
                {settingHint ?? 'The backdrop and the ambient sound come from this place.'}
              </Description>
            )}
          </TextField>

          <TextField isInvalid={showErrors && missingPrompt}>
            <Label className="text-base">Your story idea</Label>
            <TextArea
              value={prompt}
              onChangeText={(text) => {
                setPrompt(text);
                if (showErrors) setShowErrors(false);
              }}
              placeholder="A quiet kid finds a note in their locker that knows their secret…"
              numberOfLines={5}
              className="min-h-32 rounded-2xl text-lg leading-7"
            />
            {showErrors && missingPrompt ? (
              <FieldError>Add a sentence or two so we know where to start.</FieldError>
            ) : (
              <Description>A sentence is enough. More detail means a closer match.</Description>
            )}
          </TextField>

          <View className="gap-3">
            <Label className="text-base">Art style</Label>
            <View className="flex-row gap-3">
              {STYLES.map((option) => {
                const isSelected = option.id === styleId;
                const swatch = STYLE_SWATCHES[option.id];
                return (
                  <Button
                    key={option.id}
                    variant="tertiary"
                    className={
                      isSelected
                        ? 'border-accent h-auto flex-1 flex-col gap-2 rounded-2xl border p-2'
                        : 'border-border/70 h-auto flex-1 flex-col gap-2 rounded-2xl border p-2'
                    }
                    onPress={() => setStyleId(option.id)}
                    accessibilityState={{ selected: isSelected }}
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
                            style={{ backgroundColor: 'rgba(13, 10, 6, 0.7)' }}
                          >
                            <Check size={16} color={palette.accent} />
                          </View>
                        </View>
                      ) : null}
                    </View>
                    <Button.Label
                      className={
                        isSelected
                          ? 'text-accent text-center text-xs font-semibold'
                          : 'text-muted text-center text-xs font-semibold'
                      }
                    >
                      {option.label}
                    </Button.Label>
                  </Button>
                );
              })}
            </View>
          </View>

          <TextField>
            <Label className="text-base">Your name (optional)</Label>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mia"
              autoCapitalize="words"
              autoCorrect={false}
              className="h-14 rounded-2xl text-lg"
            />
            <Description>Friends see this on their match score.</Description>
          </TextField>
        </View>
      </ScrollView>

      <View className="pb-safe-offset-4 gap-2 px-6 pt-3">
        <LinearGradient
          pointerEvents="none"
          colors={[palette.transparent, palette.background]}
          style={{ position: 'absolute', left: 0, right: 0, top: -28, height: 28 }}
        />
        <Button size="lg" className="h-14 rounded-2xl" onPress={handleStart}>
          <BookOpen size={20} color={palette.accentForeground} />
          <Button.Label className="text-lg font-semibold">Start My Story</Button.Label>
        </Button>
        <Button size="md" variant="ghost" onPress={() => router.push('/enter')}>
          <KeyRound size={16} color={palette.muted} />
          <Button.Label className="text-muted text-base">Enter a shared story</Button.Label>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
