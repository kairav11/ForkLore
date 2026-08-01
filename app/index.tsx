import { Fragment, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Chip,
  Description,
  FieldError,
  Label,
  Select,
  Separator,
  Text,
  TextField,
  TextArea,
} from 'heroui-native';
import { BookOpen, KeyRound, Sparkles } from 'lucide-react-native';

import { SETTINGS, STYLES } from '@/lib/settings';
import { palette } from '@/lib/theme';
import type { StyleId } from '@/lib/types';

interface SelectValue {
  value: string;
  label: string;
}

export default function SetupScreen() {
  const router = useRouter();
  const [setting, setSetting] = useState<SelectValue | undefined>();
  const [prompt, setPrompt] = useState('');
  const [styleId, setStyleId] = useState<StyleId>('flat-illustrated');
  const [showErrors, setShowErrors] = useState(false);

  const missingSetting = setting === undefined;
  const missingPrompt = prompt.trim().length === 0;

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
        contentContainerClassName="px-6 pt-safe-offset-6 pb-10 gap-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Sparkles size={22} color={palette.accent} />
            <Text className="text-accent text-base font-semibold tracking-widest uppercase">
              StoryBranch
            </Text>
          </View>
          <Text.Heading type="h1" className="text-4xl leading-tight">
            Write the start. Choose the rest.
          </Text.Heading>
          <Text.Paragraph color="muted" className="text-lg leading-7">
            Pick a place, add your idea, and every scene branches on your decisions.
          </Text.Paragraph>
        </View>

        <TextField isInvalid={showErrors && missingSetting}>
          <Label className="text-lg">Where does it happen?</Label>
          <Select value={setting} onValueChange={setSetting}>
            <Select.Trigger className="h-14">
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
            <Description>The background and ambient sound come from this place.</Description>
          )}
        </TextField>

        <TextField isInvalid={showErrors && missingPrompt}>
          <Label className="text-lg">Your story idea</Label>
          <TextArea
            value={prompt}
            onChangeText={(text) => {
              setPrompt(text);
              if (showErrors) setShowErrors(false);
            }}
            placeholder="A quiet kid finds a note in their locker that knows their secret..."
            numberOfLines={5}
            className="min-h-32 text-lg leading-7"
          />
          {showErrors && missingPrompt ? (
            <FieldError>Add a sentence or two so we know where to start.</FieldError>
          ) : (
            <Description>A sentence is enough. More detail means a closer match.</Description>
          )}
        </TextField>

        <View className="gap-3">
          <Label className="text-lg">Art style</Label>
          <View className="flex-row flex-wrap gap-2">
            {STYLES.map((option) => {
              const isSelected = option.id === styleId;
              return (
                <Chip
                  key={option.id}
                  size="lg"
                  variant={isSelected ? 'primary' : 'tertiary'}
                  color={isSelected ? 'accent' : 'default'}
                  onPress={() => setStyleId(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Chip.Label className="text-base">{option.label}</Chip.Label>
                </Chip>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Button size="lg" onPress={handleStart}>
            <BookOpen size={20} color={palette.accentForeground} />
            <Button.Label className="text-lg">Start My Story</Button.Label>
          </Button>
          <Button size="lg" variant="ghost" onPress={() => router.push('/enter')}>
            <KeyRound size={18} color={palette.muted} />
            <Button.Label className="text-base">Enter a Shared Story</Button.Label>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
