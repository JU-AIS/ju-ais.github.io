import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const events = defineCollection({
  loader: glob({
    pattern: ['*/index.md', 'hitract/*/index.md'],
    base: './src/content/events',
    generateId: ({ entry }) => entry.split('/').at(-2)!,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      location: z.string(),
      type: z.enum(['hackathon', 'lecture', 'workshop', 'social', 'company visit']),
      cover: image().nullish(),
      coverAlt: z.string().nullish(),
      signup: z.url().nullish(),
      photos: z.array(image()).nullish(),
      hitractId: z.number().nullish(),
      hitractImageId: z.number().nullish(),
    }),
});

export const collections = { events };
