"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { IconCash, IconBuildingWarehouse, IconListNumbers, IconFileInvoice } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compra } from "@/lib/schemas";

interface CompraStatsCardsProps {
  compras: Compra[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export function CompraStatsCards({ compras }: CompraStatsCardsProps) {
  // CORREÇÃO: Lógica de estatísticas alinhada com o schema final
  const stats = useMemo(() => {
    const totalGasto = compras.reduce((acc, compra) => acc + compra.valorTotal, 0);
    const totalCompras = compras.length;
    const totalItens = compras.reduce((acc, compra) => acc + compra.itens.length, 0);
    // Conta quantos fornecedores únicos existem na lista de compras do período
    const fornecedoresUnicos = new Set(compras.map(c => c.fornecedorId)).size;

    return { totalGasto, totalCompras, totalItens, fornecedoresUnicos };
  }, [compras]);

  const cards = [
    { title: "Valor Total Gasto", value: stats.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: IconCash },
    { title: "Compras Registradas", value: stats.totalCompras.toString(), icon: IconFileInvoice },
    { title: "Total de Itens", value: stats.totalItens.toString(), icon: IconListNumbers },
    { title: "Fornecedores Diferentes", value: stats.fornecedoresUnicos.toString(), icon: IconBuildingWarehouse }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div key={card.title} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
