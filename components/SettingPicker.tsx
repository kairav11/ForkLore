import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Check, ChevronDown, Plus, X } from 'lucide-react-native';

import { MAX_PLACE_HINT, MAX_PLACE_LABEL, type PlaceOption, usePlacesStore } from '@/lib/places';
import { palette } from '@/lib/theme';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { FieldInput } from '@/components/ui/FieldInput';
import { Body, Mono } from '@/components/ui/Text';

interface SettingPickerProps {
  value: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (place: PlaceOption) => void;
}

/** Beyond this many rows the list scrolls inside the card instead of growing. */
const MAX_VISIBLE = 7;
const ROW_HEIGHT = 58;

/**
 * Custom dropdown for the story's location: a charcoal row that expands into the
 * shared list of places in place, with an "Add a place" row at the bottom.
 *
 * The list comes from the project database, so a place one reader adds is offered
 * to everyone from then on.
 */
export function SettingPicker({ value, isOpen, onToggle, onSelect }: SettingPickerProps) {
  const places = usePlacesStore((state) => state.places);
  const isLoading = usePlacesStore((state) => state.isLoading);
  const load = usePlacesStore((state) => state.load);
  const add = usePlacesStore((state) => state.add);

  const [isAdding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [hint, setHint] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const closeForm = useCallback(() => {
    setAdding(false);
    setLabel('');
    setHint('');
    setError(null);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const place = await add(label, hint);
      closeForm();
      onSelect(place);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not save that place.');
    } finally {
      setSaving(false);
    }
  }, [add, closeForm, hint, label, onSelect]);

  const selected = places.find((place) => place.id === value) ?? null;

  return (
    <View className="gap-2">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Choose a setting"
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View className="flex-row items-center justify-between gap-3">
          {selected ? (
            <Display className="flex-1 text-[22px] leading-7">{selected.label}</Display>
          ) : (
            <Body className="text-muted flex-1 text-[17px]">Choose a setting</Body>
          )}
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.surfaceRaised }}
          >
            <ChevronDown
              size={16}
              color={palette.foreground}
              style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
            />
          </View>
        </View>
      </Pressable>

      {isOpen ? (
        <View
          className="gap-1 rounded-2xl p-1"
          style={{
            backgroundColor: palette.background,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <ScrollView
            style={{ maxHeight: MAX_VISIBLE * ROW_HEIGHT }}
            contentContainerClassName="gap-1"
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {places.map((place) => {
              const isSelected = place.id === value;
              return (
                <Pressable
                  key={place.id}
                  onPress={() => onSelect(place)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <View
                    className="flex-row items-center gap-3 rounded-xl px-3 py-3"
                    style={{
                      backgroundColor: isSelected ? palette.accentSoft : palette.transparent,
                    }}
                  >
                    <View
                      className="w-[3px] self-stretch rounded-full"
                      style={{
                        backgroundColor: isSelected ? palette.accent : palette.transparent,
                      }}
                    />
                    <View className="flex-1 gap-0.5">
                      <Body
                        weight="medium"
                        className="text-[16px]"
                        color={isSelected ? palette.accent : palette.foreground}
                      >
                        {place.label}
                      </Body>
                      {place.hint.length > 0 ? (
                        <Mono className="text-[10px] tracking-[1px] uppercase">{place.hint}</Mono>
                      ) : (
                        <Mono className="text-[10px] tracking-[1px] uppercase">
                          Added by a reader
                        </Mono>
                      )}
                    </View>
                    {isSelected ? <Check size={16} color={palette.accent} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <View className="flex-row items-center gap-2 px-3 py-2">
              <ActivityIndicator size="small" color={palette.muted} />
              <Mono className="text-[9px] tracking-[2px] uppercase">Loading places</Mono>
            </View>
          ) : null}

          {isAdding ? (
            <View
              className="gap-3 rounded-xl px-3 py-3"
              style={{ backgroundColor: palette.surface }}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Mono className="text-[9px] tracking-[2px] uppercase" color={palette.accent}>
                  New place
                </Mono>
                <Pressable
                  onPress={closeForm}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel adding a place"
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <X size={15} color={palette.muted} />
                </Pressable>
              </View>

              <FieldInput
                value={label}
                onChangeText={(text) => {
                  setLabel(text);
                  if (error) setError(null);
                }}
                placeholder="On a night train"
                autoCapitalize="sentences"
                autoCorrect={false}
                maxLength={MAX_PLACE_LABEL}
                minHeight={36}
              />
              <View className="h-[1px]" style={{ backgroundColor: palette.border }} />
              <FieldInput
                value={hint}
                onChangeText={setHint}
                placeholder="Sleeper carriage, rails clicking (optional)"
                autoCapitalize="sentences"
                maxLength={MAX_PLACE_HINT}
                minHeight={36}
              />

              {error ? (
                <Body className="text-[13px] leading-5" color={palette.pathA}>
                  {error}
                </Body>
              ) : (
                <Body className="text-muted text-[13px] leading-5">
                  Saved for everyone who uses the app.
                </Body>
              )}

              <ActionButton
                label={isSaving ? 'Saving' : 'Save place'}
                size="sm"
                icon={Check}
                disabled={isSaving}
                leading={
                  isSaving ? (
                    <ActivityIndicator size="small" color={palette.accentForeground} />
                  ) : undefined
                }
                onPress={() => void save()}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setAdding(true)}
              accessibilityRole="button"
              accessibilityLabel="Add a place"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View className="flex-row items-center gap-3 rounded-xl px-3 py-3">
                <View
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: palette.accentSoft,
                    borderWidth: 1,
                    borderColor: palette.pathAEdge,
                  }}
                >
                  <Plus size={14} color={palette.accent} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Body weight="medium" className="text-[16px]" color={palette.accent}>
                    Add a place
                  </Body>
                  <Mono className="text-[10px] tracking-[1px] uppercase">Everyone gets it too</Mono>
                </View>
              </View>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}
