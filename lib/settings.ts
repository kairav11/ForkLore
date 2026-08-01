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
 * Twelve treatments, each with a real sample in `assets/images/style-*.png` — the
 * same scene drawn twelve ways, so the choice is made by eye rather than by name.
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
  {
    id: 'realistic',
    label: 'Realistic',
    direction:
      'Photorealistic cinematic photograph, not an illustration: shot on a full-frame camera with a 35mm lens at f/1.8, true-to-life skin, fabric and surface textures, natural shallow depth of field with soft background falloff, realistic lens bokeh and reflections, physically accurate lighting, fine sensor grain. Looks like real life.',
  },
  {
    id: 'papercraft',
    label: 'Papercraft',
    direction:
      'Handmade papercraft diorama photographed as a real three-dimensional object: everything cut, folded and glued from coloured cardstock, visible paper thickness at every cut edge, layered paper planes receding in depth, crisp craft-knife cuts and folded creases, soft drop shadows between layers, matte fibrous paper texture, warm studio light, shallow depth of field.',
  },
  {
    id: 'futuristic',
    label: 'Ultra Futuristic',
    direction:
      'Ultra futuristic science-fiction film still from a high-budget blockbuster: immaculate high-tech production design, brushed metal and glass, holographic cyan and amber interface glyphs floating in the air, volumetric light shafts and atmospheric haze, wet reflective floors with neon reflections, thin emissive strip lighting, anamorphic lens flares, cool teal shadows against a warm key light, cinematic colour grade.',
  },
] as const;

/** Name plus treatment, as the writer and the image model receive it. */
export function stylePrompt(id: StyleId | null | undefined): string {
  const option = STYLES.find((entry) => entry.id === id);
  return option ? `${option.label}. ${option.direction}` : '';
}
