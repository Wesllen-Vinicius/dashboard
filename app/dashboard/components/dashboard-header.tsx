"use client";

import { useAuthStore } from "@/store/auth.store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { IconLayoutGrid, IconSettings } from "@tabler/icons-react";

interface DashboardHeaderProps {
    isEditing: boolean;
    onEditToggle: (isEditing: boolean) => void;
    onSettingsToggle: () => void;
}

export function DashboardHeader({ isEditing, onEditToggle, onSettingsToggle }: DashboardHeaderProps) {
    const { user } = useAuthStore();
    const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

    return (
        <motion.div
            className="flex flex-col md:flex-row md:items-center md:justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Bem-vindo de volta, {user?.displayName?.split(" ")[0]}!
                </h1>
                <p className="text-muted-foreground capitalize">{today}</p>
            </div>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <div className="flex items-center space-x-2">
                    <IconLayoutGrid className="text-muted-foreground" />
                    <Label htmlFor="edit-mode-toggle">Modo de Edição</Label>
                    <Switch
                        id="edit-mode-toggle"
                        checked={isEditing}
                        onCheckedChange={onEditToggle}
                    />
                </div>
                {/* Botão de Configurações adicionado */}
                <Button variant="outline" size="icon" onClick={onSettingsToggle}>
                    <IconSettings className="h-5 w-5" />
                </Button>
            </div>
        </motion.div>
    );
}
