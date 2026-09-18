import { defineCollection } from 'astro:content';
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
});

const sections = defineCollection({
  loader: glob({
    base: './binder',
    pattern: [
      '**/introduction.md',
      '!introduction.md',
    ],
  }),
});

export const collections = {
  songs,
  sections,
};