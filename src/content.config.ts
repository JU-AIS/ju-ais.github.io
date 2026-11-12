import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const events = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/events',
    generateId: ({ entry }) => entry.split('/')[0],
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
    }),
});

export const collections = { events };
