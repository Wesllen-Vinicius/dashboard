"use client";
import { motion } from "framer-motion";

export function BrandingPanel() {
  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1620912189835-35c426a3a75a?q=80&w=1887&auto=format&fit=crop)" }}
      />
      <div className="absolute inset-0 bg-zinc-900 opacity-60" />

      <div className="relative z-20 flex items-center text-lg font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
        Seu Frigorífico
      </div>

      <motion.div
        className="relative z-20 mt-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
      >
        <blockquote className="space-y-2">
          <p className="text-lg">
            “O controle preciso e a gestão eficiente são os pilares do nosso sucesso. Este sistema é a nossa ferramenta para alcançar a excelência.”
          </p>
          <footer className="text-sm">Diretoria</footer>
        </blockquote>
      </motion.div>
    </div>
  );
}
