"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCards, Stats } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { ChartBarTopProducts } from "@/components/chart-bar-top-products";
import { ChartVendasCondicao } from "@/components/chart-vendas-condicao";
import { ChartRendimentoProducao } from "@/components/chart-rendimento-producao";
import { getDashboardStats, getMovimentacoesParaGrafico, getProdutosMaisVendidos, getVendasPorCondicao, getProducaoResumoPeriodo } from "@/lib/services/dashboard.services";
import { saveDashboardLayout, getDashboardLayout } from "@/lib/services/user.services";
import { DashboardHeader } from "./components/dashboard-header";
import { DraggableWidget } from "./components/draggable-widget";

const initialWidgetOrder = ["stats", "movimentacoes", "topProdutos", "vendasCondicao", "rendimento"];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [movimentacoesData, setMovimentacoesData] = useState<any[]>([]);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);
  const [vendasCondicaoData, setVendasCondicaoData] = useState<any[]>([]);
  const [rendimentoData, setRendimentoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(initialWidgetOrder);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [statsData, movData, topProdData, vendasCondicao, rendimento, savedLayout] = await Promise.all([
          getDashboardStats(), getMovimentacoesParaGrafico(), getProdutosMaisVendidos(), getVendasPorCondicao(), getProducaoResumoPeriodo(), getDashboardLayout(user.uid)
        ]);
        setStats(statsData); setMovimentacoesData(movData); setTopProductsData(topProdData);
        setVendasCondicaoData(vendasCondicao); setRendimentoData(rendimento);
        if (savedLayout) {
          setWidgetOrder(savedLayout);
        }
      } catch (error) {
        toast.error("Não foi possível carregar os dados do dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && user) {
      const newOrder = arrayMove(widgetOrder, widgetOrder.indexOf(active.id as string), widgetOrder.indexOf(over.id as string));
      setWidgetOrder(newOrder);
      try {
        await saveDashboardLayout(user.uid, newOrder);
        toast.success("Layout do dashboard salvo!");
      } catch {
        toast.error("Não foi possível salvar o novo layout.");
      }
    }
  };

  const widgets: { [key: string]: React.ReactNode } = {
    stats: stats && <SectionCards stats={stats} />,
    movimentacoes: <ChartAreaInteractive data={movimentacoesData} />,
    rendimento: rendimentoData && <ChartRendimentoProducao data={rendimentoData} />,
    topProdutos: <ChartBarTopProducts data={topProductsData} />,
    vendasCondicao: <ChartVendasCondicao data={vendasCondicaoData} />,
  };

  const widgetLayouts: { [key: string]: string } = {
    stats: "col-span-1 md:col-span-4",
    movimentacoes: "col-span-1 md:col-span-4",
    rendimento: "col-span-1 md:col-span-4",
    topProdutos: "col-span-1 md:col-span-2",
    vendasCondicao: "col-span-1 md:col-span-2",
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <DashboardHeader isEditing={isEditing} onEditToggle={setIsEditing} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.05 }}
          >
            {widgetOrder.map(id => (
              <div key={id} className={widgetLayouts[id] || "col-span-1 md:col-span-4"}>
                {isLoading ? (
                  <Skeleton className="h-64 w-full rounded-lg" />
                ) : (
                  <DraggableWidget id={id} isEditing={isEditing}>
                    {widgets[id]}
                  </DraggableWidget>
                )}
              </div>
            ))}
          </motion.div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
