import { z } from 'zod';
import { produtoSchema, produtoVendaSchema, produtoUsoInternoSchema, produtoMateriaPrimaSchema } from '@/lib/schemas';

export type Produto = z.infer<typeof produtoSchema>;
export type ProdutoVenda = z.infer<typeof produtoVendaSchema>;
export type ProdutoUsoInterno = z.infer<typeof produtoUsoInternoSchema>;
export type ProdutoMateriaPrima = z.infer<typeof produtoMateriaPrimaSchema>;
