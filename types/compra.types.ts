import { z } from 'zod';
import { compraSchema } from '@/lib/schemas';

export type Compra = z.infer<typeof compraSchema> & { id?: string };
