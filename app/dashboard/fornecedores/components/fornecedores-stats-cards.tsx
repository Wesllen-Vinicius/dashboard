"use client";

import { useMemo } from 'react';
import { Fornecedor, Abate } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconUserPlus, IconReceipt, IconShoppingCart } from "@tabler/icons-react";
import { subDays, isAfter } from "date-fns";
import { useDataStore } from '@/store/data.store';
import { formatCurrency } from '@/lib/utils/formatters';

interface StatsCardsProps {
  fornecedores: Fornecedor[];
}

// Interface para garantir a tipagem correta das contas a pagar
interface ContaAPagar {
  id?: string;
  fornecedorId: string;
  valor: number;
  status: 'Pendente' | 'Paga';
}

export function FornecedoresStatsCards({ fornecedores }: StatsCardsProps) {
  // Puxa os dados do store, com um valor padrão para contasAPagar para evitar erros
  const { abates, contasAPagar = [] } = useDataStore() as { abates: Abate[], contasAPagar?: ContaAPagar[] };

  const stats = useMemo(() => {
    const fornecedoresAtivosIds = fornecedores.filter(f => f.status === 'ativo').map(f => f.id);

    const totalAtivos = fornecedoresAtivosIds.length;

    const umMesAtras = subDays(new Date(), 30);
    const novosNoMes = fornecedores.filter(f => {
      // O createdAt já é um objeto Date ou um Timestamp do Firestore
      const createdAtDate = f.createdAt?.toDate ? f.createdAt.toDate() : f.createdAt;
      return createdAtDate && isAfter(createdAtDate, umMesAtras);
    }).length;

    const totalAPagar = contasAPagar
        .filter(c => c.status === 'Pendente' && fornecedoresAtivosIds.includes(c.fornecedorId))
        .reduce((acc, c) => acc + c.valor, 0);

    const comprasUltimos30d = abates
        .filter(abate => {
            // O campo 'data' já é um objeto Date, não precisa de .toDate()
            const dataAbate = new Date(abate.data);
            return isAfter(dataAbate, umMesAtras) && fornecedoresAtivosIds.includes(abate.fornecedorId);
        })
        .reduce((acc, abate) => acc + (abate.custoTotal || 0), 0);

    return {
      totalAtivos,
      novosNoMes,
      totalAPagar: formatCurrency(totalAPagar),
      comprasUltimos30d: formatCurrency(comprasUltimos30d)
    };
  }, [fornecedores, abates, contasAPagar]);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAtivos}</div>
          <p className="text-xs text-muted-foreground">Total de fornecedores com status ativo</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos no Mês</CardTitle>
          <IconUserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.novosNoMes}</div>
          <p className="text-xs text-muted-foreground">Novos fornecedores nos últimos 30 dias</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
          <IconReceipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAPagar}</div>
          <p className="text-xs text-muted-foreground">Soma das contas pendentes de fornecedores ativos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compras (Últimos 30d)</CardTitle>
          <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.comprasUltimos30d}</div>
          <p className="text-xs text-muted-foreground">Valor total de abates de fornecedores ativos</p>
        </CardContent>
      </Card>
    </div>
  );
}
