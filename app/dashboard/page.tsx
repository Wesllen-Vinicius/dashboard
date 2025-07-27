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
import { saveDashboardConfig, getDashboardConfig } from "@/lib/services/user.services";
import { DashboardHeader } from "./components/dashboard-header";
import { DraggableWidget } from "./components/draggable-widget";
import { DashboardSettings } from "./components/dashboard-settings";

// Tipagem para a configuração de um único widget
type WidgetConfig = {
  name: string;
  visible: boolean;
  layout: string;
};

// Tipagem para o objeto completo de configurações
type AllWidgetsConfig = {
  [key: string]: WidgetConfig;
};

const allWidgetsInfo: AllWidgetsConfig = {
  stats: { name: "Estatísticas Gerais", visible: true, layout: "col-span-1 md:col-span-4" },
  movimentacoes: { name: "Movimentações (Últimos 30 dias)", visible: true, layout: "col-span-1 md:col-span-4" },
  rendimento: { name: "Rendimento da Produção", visible: true, layout: "col-span-1 md:col-span-4" },
  topProdutos: { name: "Produtos Mais Vendidos", visible: true, layout: "col-span-1 md:col-span-2" },
  vendasCondicao: { name: "Vendas por Condição", visible: true, layout: "col-span-1 md:col-span-2" },
};

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [movimentacoesData, setMovimentacoesData] = useState<any[]>([]);
    const [topProductsData, setTopProductsData] = useState<any[]>([]);
    const [vendasCondicaoData, setVendasCondicaoData] = useState<any[]>([]);
    const [rendimentoData, setRendimentoData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [widgetConfig, setWidgetConfig] = useState<AllWidgetsConfig>(allWidgetsInfo);
    const [widgetOrder, setWidgetOrder] = useState<string[]>(Object.keys(allWidgetsInfo));

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [statsData, movData, topProdData, vendasCondicao, rendimento, savedConfig] = await Promise.all([
                    getDashboardStats(), getMovimentacoesParaGrafico(), getProdutosMaisVendidos(), getVendasPorCondicao(), getProducaoResumoPeriodo(), getDashboardConfig(user.uid)
                ]);
                setStats(statsData); setMovimentacoesData(movData); setTopProductsData(topProdData);
                setVendasCondicaoData(vendasCondicao); setRendimentoData(rendimento);

                if (savedConfig) {
                    setWidgetOrder(savedConfig.order);
                    setWidgetConfig(prevConfig => {
                        const newConfig = { ...prevConfig };
                        for (const key in newConfig) {
                            if (savedConfig.visible.hasOwnProperty(key)) {
                                newConfig[key].visible = savedConfig.visible[key];
                            }
                        }
                        return newConfig;
                    });
                }
            } catch (error) {
                toast.error("Não foi possível carregar os dados do dashboard.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleSaveConfig = async (order: string[], config: AllWidgetsConfig) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const visible = Object.fromEntries(Object.entries(config).map(([id, { visible }]) => [id, visible]));
            await saveDashboardConfig(user.uid, { order, visible });
            toast.success("Configurações do dashboard salvas!");
        } catch {
            toast.error("Não foi possível salvar as configurações.");
        } finally {
            setIsSaving(false);
            setIsSettingsOpen(false);
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id && user) {
            const newOrder = arrayMove(widgetOrder, widgetOrder.indexOf(active.id as string), widgetOrder.indexOf(over.id as string));
            setWidgetOrder(newOrder);
            await handleSaveConfig(newOrder, widgetConfig);
        }
    };

    const widgets: { [key: string]: React.ReactNode } = {
        stats: stats && <SectionCards stats={stats} />,
        movimentacoes: <ChartAreaInteractive data={movimentacoesData} />,
        rendimento: rendimentoData && <ChartRendimentoProducao data={rendimentoData} />,
        topProdutos: <ChartBarTopProducts data={topProductsData} />,
        vendasCondicao: <ChartVendasCondicao data={vendasCondicaoData} />,
    };

    const visibleWidgets = widgetOrder.filter(id => widgetConfig[id]?.visible);

    return (
        <>
            <DashboardSettings
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                widgetConfig={widgetConfig}
                onConfigChange={setWidgetConfig}
                onSave={() => handleSaveConfig(widgetOrder, widgetConfig)}
                isSaving={isSaving}
            />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <DashboardHeader
                    isEditing={isEditing}
                    onEditToggle={setIsEditing}
                    onSettingsToggle={() => setIsSettingsOpen(true)}
                />
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-4 gap-6"
                            initial="hidden"
                            animate="visible"
                            transition={{ staggerChildren: 0.05 }}
                        >
                            {visibleWidgets.map(id => (
                                <div key={id} className={widgetConfig[id]?.layout || "col-span-1 md:col-span-4"}>
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
        </>
    );
}
