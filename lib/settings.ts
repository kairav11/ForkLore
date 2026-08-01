import type { SettingId, StyleId } from '@/lib/types';

export interface SettingOption {
  id: SettingId;
  label: string;
  hint: string;
}

export const SETTINGS: readonly SettingOption[] = [
  { id: 'school', label: 'At School', hint: 'Hallways, lockers, late bells' },
  { id: 'club', label: 'At a Club', hint: 'Strobe lights and loud bass' },
  { id: 'bar', label: 'In a Bar', hint: 'Low light, long conversations' },
  { id: 'city-center', label: 'In the City Center', hint: 'Crowds, traffic, neon' },
  { id: 'tv-tower', label: 'Near the Berlin TV Tower', hint: 'Alexanderplatz at dusk' },
] as const;

export interface StyleOption {
  id: StyleId;
  label: string;
}

export const STYLES: readonly StyleOption[] = [
  { id: 'flat-illustrated', label: 'Flat Illustrated' },
  { id: 'comic-ink', label: 'Comic Ink' },
  { id: 'painterly', label: 'Painterly' },
] as const;

export function settingLabel(id: SettingId | null | undefined): string {
  return SETTINGS.find((option) => option.id === id)?.label ?? 'Your story';
}

export function styleLabel(id: StyleId | null | undefined): string {
  return STYLES.find((option) => option.id === id)?.label ?? '';
}
