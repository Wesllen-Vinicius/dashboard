'use client';

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { IconChartBar, IconInfoCircle } from "@tabler/icons-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getProducoesPorPeriodo } from "@/lib/services/relatorios.services";
import { useDataStore } from "@/store/data.store";

interface AnaliseResult {
  totalAbatido: number;
  totalProduzido: number;
  rendimentoPercentual: number;
}

export function AnaliseAbateCard() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [resultado, setResultado] = useState<AnaliseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { abates } = useDataStore();

  const handleGenerateAnalysis = async () => {
    if (!date?.from || !date?.to) {
      toast.error("Por favor, selecione um período de início e fim.");
      return;
    }

    setIsLoading(true);
    setResultado(null);
    try {
      // pega as produções no período
      const producoesNoPeriodo = await getProducoesPorPeriodo(date.from, date.to);

      // pega os abates no mesmo período
      const abatesNoPeriodo = abates.filter(a => {
        const d = new Date(a.data);
        return d >= date.from! && d <= date.to!;
      });

      if (abatesNoPeriodo.length === 0) {
        toast.info("Nenhum abate encontrado no período para análise.");
        return;
      }

      // peso médio por animal válido
      const pesoMedioCarcacaKg = 250;

      // TOTAL ABATIDO: soma de (numeroAnimais - condenado) * peso médio
      const totalAbatido = abatesNoPeriodo.reduce((acc, abate) => {
        const validos = abate.numeroAnimais - (abate.condenado || 0);
        return acc + validos * pesoMedioCarcacaKg;
      }, 0);

      // TOTAL PRODUZIDO: soma de todas as quantidades produzidas dos registros vinculados
      const totalProduzido = producoesNoPeriodo
        .filter(p => abatesNoPeriodo.some(a => a.id === p.abateId))
        .reduce((acc, p) =>
          acc + p.produtos.reduce((s, item) => s + item.quantidade, 0)
        , 0);

      // rendimento em %
      const rendimentoPercentual = totalAbatido > 0
        ? (totalProduzido / totalAbatido) * 100
        : 0;

      setResultado({ totalAbatido, totalProduzido, rendimentoPercentual });
    } catch (err: any) {
      toast.error("Erro ao gerar a análise.", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Rendimento da Carcaça</CardTitle>
        <CardDescription className="flex items-center gap-1">
          Compare o peso de carcaça (abates) com o peso de produtos (produção).
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <IconInfoCircle className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Esta análise utiliza um peso médio de carcaça de 250 kg por animal válido.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
          <div className="grid gap-1.5 w-full sm:w-auto">
            <DateRangePicker date={date} onDateChange={setDate} />
          </div>
          <Button onClick={handleGenerateAnalysis} disabled={isLoading}>
            {isLoading ? "Analisando..." : "Gerar Análise"}
          </Button>
        </div>

        {resultado ? (
          <motion.div
            className="space-y-4 pt-4 border-t"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">
                Peso Estimado da Carcaça
              </span>
              <span className="font-mono">{resultado.totalAbatido.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">
                Total de Produtos Acabados
              </span>
              <span className="font-mono">{resultado.totalProduzido.toFixed(2)} kg</span>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base text-primary">
                  Rendimento Real
                </span>
                <span className="font-bold text-xl text-primary">
                  {resultado.rendimentoPercentual.toFixed(1)}%
                </span>
              </div>
              <Progress value={resultado.rendimentoPercentual} className="h-3" />
            </div>
          </motion.div>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center h-24 text-center border-t pt-4">
            <IconChartBar className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Selecione um período para ver a análise de rendimento.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
