import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const songs = defineCollection({
  loader: glob({
    base: './binder',
    pattern: [
      '**/*.md',
      '!**/introduction.md',
      '!**/track-list*.md',
      '!introduction.md',
      '!title-page.md',
    ],
  }),
  schema: z.object({
    title: z.string().optional(),
    authority: z.string().optional(),
    videoSource: z.string().url().optional(),
  }),
});

const sections = defineCollection({
  loader: glob({
    base: './binder',
    pattern: [
      '**/introduction.md',
      '!introduction.md',
    ],
  }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

export const collections = {
  songs,
  sections,
};