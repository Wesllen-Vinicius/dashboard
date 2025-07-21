import { z } from 'zod';
import { abateSchema } from '@/lib/schemas';

export type Abate = z.infer<typeof abateSchema>;
