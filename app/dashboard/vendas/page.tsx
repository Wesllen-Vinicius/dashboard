"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconAlertTriangle } from "@tabler/icons-react";
import { NfePreviewModal } from "@/components/nfe-preview-modal";
import { useDataStore } from "@/store/data.store";
import { useAuthStore } from "@/store/auth.store";
import { Venda, Produto, Unidade, CompanyInfo, Cliente } from "@/lib/schemas";
import { emitirNFe } from "@/lib/services/nfe.services";
import { getCompanyInfo } from "@/lib/services/settings.services";
import { updateVenda } from "@/lib/services/vendas.services";
import { VendasActions } from "./components/vendas-actions";
import { VendasStatsCards } from "./components/vendas-stats-cards";
import { VendaForm } from "./components/venda-form";
import { VendasTable } from "./components/vendas-table";
import { Button } from "@/components/ui/button";

type VendaComDetalhes = Venda & { clienteNome?: string };

// Tipagem para os dados do preview da NFE, garantindo consistência
type NfePreviewData = {
    venda: Venda;
    empresa: CompanyInfo;
    cliente: Cliente;
    todosProdutos: Produto[];
    todasUnidades: Unidade[];
};

export default function VendasPage() {
    const { produtos, clientes, vendas, unidades } = useDataStore();
    const { role } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [vendaToEdit, setVendaToEdit] = useState<Venda | null>(null);

    const [isNfeModalOpen, setIsNfeModalOpen] = useState(false);
    const [nfePreviewData, setNfePreviewData] = useState<NfePreviewData | null>(null);
    const [isEmittingNfe, setIsEmittingNfe] = useState(false);
    const isReadOnly = role !== 'ADMINISTRADOR';

    const vendasEnriquecidas = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return vendas
            .map(venda => ({ ...venda, clienteNome: clientes.find(c => c.id === venda.clienteId)?.nomeRazaoSocial || 'N/A' }))
            .filter(v => v.clienteNome?.toLowerCase().includes(lowercasedFilter))
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()); // Ordena por data
    }, [vendas, clientes, searchTerm]);

    const handlePrepareNFe = async (venda: VendaComDetalhes) => {
        const toastId = toast.loading("Preparando dados da NF-e...");
        try {
            const cliente = clientes.find(c => c.id === venda.clienteId);
            const empresaInfo = await getCompanyInfo();

            if (!cliente || !empresaInfo) {
                throw new Error("Dados do cliente ou da empresa não foram encontrados.");
            }

            // Garante que todos os dados necessários são passados com a tipagem correta
            setNfePreviewData({
                venda,
                empresa: empresaInfo,
                cliente,
                todosProdutos: produtos,
                todasUnidades: unidades
            });

            setIsNfeModalOpen(true);
            toast.dismiss(toastId);
        } catch (error: any) {
            toast.error("Erro ao preparar NF-e", { id: toastId, description: error.message });
        }
    };

    const handleConfirmAndEmitNFe = async (formData: NfePreviewData) => {
        setIsEmittingNfe(true);
        const toastId = toast.loading("Enviando dados para a Sefaz...");
        try {
            const resultado = await emitirNFe(formData.venda, formData.empresa, formData.cliente, formData.todosProdutos, formData.todasUnidades);

            if (resultado.status && formData.venda.id) {
                 const nfeUpdateData = {
                    id: resultado.ref,
                    status: resultado.status,
                    url_danfe: resultado.caminho_danfe,
                    url_xml: resultado.caminho_xml_nota_fiscal
                };
                await updateVenda(formData.venda.id, { nfe: nfeUpdateData });
            }

            if (resultado.status === 'autorizado') {
                toast.success("NF-e autorizada com sucesso!", { id: toastId });
            } else if (resultado.status === 'processando_autorizacao') {
                toast.info("NF-e em processamento. Consulte o status em breve.", { id: toastId });
            } else {
                const errorMessage = resultado.erros ? resultado.erros[0].mensagem : (resultado.mensagem_sefaz || 'Erro desconhecido');
                toast.error(`Falha na emissão: ${errorMessage}`, { id: toastId, duration: 10000 });
            }

            setIsNfeModalOpen(false);
        } catch (error: any) {
            toast.error("Erro ao emitir NF-e", { id: toastId, description: error.message });
        } finally {
            setIsEmittingNfe(false);
        }
    };

    const handleAddNew = () => {
        setVendaToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (venda: VendaComDetalhes) => {
        setVendaToEdit(venda);
        setIsFormOpen(true);
    };

    const dependenciasFaltantes = useMemo(() => {
        const faltantes = [];
        if (!clientes || clientes.length === 0) faltantes.push({ nome: "Clientes", link: "/dashboard/clientes" });
        if (produtos.filter(p => p.tipoProduto === 'VENDA').length === 0) faltantes.push({ nome: "Produtos de Venda", link: "/dashboard/produtos" });
        return faltantes;
    }, [clientes, produtos]);

    return (
        <>
            <NfePreviewModal
                isOpen={isNfeModalOpen}
                onOpenChange={setIsNfeModalOpen}
                previewData={nfePreviewData}
                onSubmit={handleConfirmAndEmitNFe}
                isLoading={isEmittingNfe}
            />
            <VendaForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                vendaToEdit={vendaToEdit}
            />

            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <VendasActions onAdd={handleAddNew} onSearch={setSearchTerm} />
                <VendasStatsCards />

                {dependenciasFaltantes.length > 0 && (
                    <Alert variant="destructive">
                        <IconAlertTriangle className="h-4 w-4" />
                        <AlertTitle>Cadastro de pré-requisito necessário</AlertTitle>
                        <AlertDescription> Para registrar uma venda, você precisa primeiro cadastrar:
                            <ul className="list-disc pl-5 mt-2">{dependenciasFaltantes.map(dep => (
                                <li key={dep.nome}>
                                    <Button variant="link" asChild className="p-0 h-auto font-bold">
                                        <Link href={dep.link}>{dep.nome}</Link>
                                    </Button>
                                </li>
                            ))}</ul>
                        </AlertDescription>
                    </Alert>
                )}

                <VendasTable
                    vendas={vendasEnriquecidas}
                    onEdit={handleEdit}
                    onPrepareNFe={handlePrepareNFe}
                    isReadOnly={isReadOnly}
                />
            </motion.div>
        </>
    );
}
