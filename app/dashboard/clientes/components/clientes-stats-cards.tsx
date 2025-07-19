import { Cliente } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconUserPlus } from "@tabler/icons-react";
import { subMonths, isAfter } from "date-fns";

interface StatsCardsProps {
  clientes: Cliente[];
}

export function ClientesStatsCards({ clientes }: StatsCardsProps) {
  const totalAtivos = clientes.filter(c => c.status === 'ativo').length;

  const umMesAtras = subMonths(new Date(), 1);
  const novosNoMes = clientes.filter(c => {
    const createdAt = c.createdAt?.toDate?.();
    return createdAt && isAfter(createdAt, umMesAtras);
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Clientes Ativos
          </CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAtivos}</div>
          <p className="text-xs text-muted-foreground">
            Total de clientes com status ativo
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos no Mês</CardTitle>
          <IconUserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{novosNoMes}</div>
          <p className="text-xs text-muted-foreground">
            Novos clientes nos últimos 30 dias
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
