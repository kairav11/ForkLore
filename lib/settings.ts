import type { StyleId } from '@/lib/types';

/** Every story is three decisions long, then it ends. */
export const DECISIONS_PER_STORY = 3;

export interface StyleOption {
  id: StyleId;
  label: string;
  /**
   * The art direction sent to the image model. The label alone is too thin to
   * draw from ("Painterly" could be anything), so every style carries the
   * concrete treatment its sample image was made with.
   */
  direction: string;
}

/**
 * Nine treatments, each with a real sample in `assets/images/style-*.png` — the
 * same scene drawn nine ways, so the choice is made by eye rather than by name.
 */
export const STYLES: readonly StyleOption[] = [
  {
    id: 'flat-illustrated',
    label: 'Flat Illustrated',
    direction:
      'Flat vector-style illustration: bold simplified shapes, no outlines, large areas of flat colour, minimal detail, strong silhouettes, limited amber and deep violet-charcoal palette.',
  },
  {
    id: 'comic-ink',
    label: 'Comic Ink',
    direction:
      'Graphic-novel ink drawing: heavy black brush outlines, crosshatched and spotted blacks, high contrast, limited flat colour over the ink, dramatic comic panel framing.',
  },
  {
    id: 'painterly',
    label: 'Painterly',
    direction:
      'Digital oil painting: visible brush strokes, soft blended edges, rich impasto texture, dramatic warm rim light against cool shadow, gallery concept-art finish.',
  },
  {
    id: 'anime-cel',
    label: 'Anime Cel',
    direction:
      'Anime cel-shaded illustration in a 1990s TV anime look: crisp black ink outlines, hard-edged two-tone cel shading, saturated flat colour fills, expressive faces, subtle lens flare.',
  },
  {
    id: 'watercolour',
    label: 'Watercolour',
    direction:
      'Loose watercolour on cold-press paper: wet-on-wet bleeds, blooming soft edges, granulating pigment, visible paper tooth, pale translucent washes with a few confident dry-brush marks.',
  },
  {
    id: 'noir-film',
    label: 'Film Noir',
    direction:
      'Black and white 1940s film noir still: monochrome greyscale only, extreme chiaroscuro, hard key light, long cast shadows, venetian-blind light slats, deep blacks, fine 35mm film grain.',
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    direction:
      'Pixel art in a 16-bit era style: chunky visible square pixels, strictly limited palette, dithered gradients, hard aliased edges, no smoothing, subtle scanline feel.',
  },
  {
    id: 'storybook',
    label: 'Storybook',
    direction:
      "Children's picture book illustration in gouache and coloured pencil: soft matte opaque paint, gentle rounded shapes, visible pencil texture and crosshatch, warm honeyed light, slightly naive proportions.",
  },
  {
    id: 'retro-print',
    label: 'Retro Print',
    direction:
      'Risograph two-colour spot-ink print on off-white uncoated paper: fluorescent amber overprinted with deep violet-blue, visible misregistration, halftone dot texture, ink mottling, flat graphic shapes.',
  },
] as const;

/** Name plus treatment, as the writer and the image model receive it. */
export function stylePrompt(id: StyleId | null | undefined): string {
  const option = STYLES.find((entry) => entry.id === id);
  return option ? `${option.label}. ${option.direction}` : '';
}
