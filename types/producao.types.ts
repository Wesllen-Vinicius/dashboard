import { z } from 'zod';
import { producaoSchema, itemProduzidoSchema } from '@/lib/schemas';

export type Producao = z.infer<typeof producaoSchema>;
export type ItemProduzido = z.infer<typeof itemProduzidoSchema>;
