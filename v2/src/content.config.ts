// src/content.config.ts
// Typed content collections. A typo in a vehicle file becomes a build error,
// never a broken page.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const vehicles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vehicles' }),
  schema: z.object({
    year: z.number().int().min(1950).max(2030),
    make: z.string(),
    model: z.string(),
    trim: z.string().optional().default(''),
    price: z.number().positive().optional(), // omit → "Call for price"
    mileage: z.number().int().nonnegative(),
    bodyStyle: z.enum(['car', 'truck', 'suv', 'van']),
    transmission: z.enum(['automatic', 'manual']).default('automatic'),
    drivetrain: z.enum(['FWD', 'RWD', 'AWD', '4WD']).optional(),
    exteriorColor: z.string().optional(),
    vin: z.string().optional().default(''),
    status: z.enum(['available', 'pending', 'sold']).default('available'),
    featured: z.boolean().default(false),
    photos: z.array(z.string()).default([]), // filenames under /public/images/vehicles/
    carfaxUrl: z.string().url().optional().or(z.literal('')),
    highlights: z.array(z.string()).default([]),
  }),
});

export const collections = { vehicles };
