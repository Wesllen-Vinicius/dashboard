// app/dashboard/estoque/movimentacoes/page.tsx
"use client";

import { motion } from "framer-motion";
import { EstoqueStatsCards } from "./components/estoque-stats-cards";
import { EstoqueForm } from "./components/estoque-form";
import { EstoqueTable } from "./components/estoque-table";

export default function MovimentacoesEstoquePage() {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Formulário de ajuste sempre no topo */}
      <EstoqueForm />

      {/* Tabs de produtos */}
      <EstoqueStatsCards />

      {/* Tabela de movimentações */}
      <EstoqueTable />
    </motion.div>
  );
}
