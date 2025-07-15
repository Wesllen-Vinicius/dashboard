"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconAlertTriangle, IconArrowRight } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MissingDependency {
  name: string;
  link: string;
}

interface DependencyAlertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dependencies: MissingDependency[];
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export function DependencyAlert({ isOpen, onOpenChange, dependencies }: DependencyAlertProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <IconAlertTriangle className="h-12 w-12 text-amber-500" />
            </motion.div>
          </div>
          <DialogTitle className="text-center">Cadastro de pré-requisito necessário</DialogTitle>
          <DialogDescription className="text-center">
            Para registrar uma nova compra, você precisa primeiro cadastrar os seguintes itens:
          </DialogDescription>
        </DialogHeader>
        <motion.div
          className="space-y-3 py-4"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {dependencies.map((dep) => (
            <motion.div key={dep.name} variants={itemVariants}>
              <Link href={dep.link} onClick={() => onOpenChange(false)}>
                <div className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent hover:text-accent-foreground">
                  <span className="font-semibold">{dep.name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Cadastrar agora <IconArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
