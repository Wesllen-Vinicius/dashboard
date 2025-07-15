import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTipoCompraLabel(tipo: string): string {
  switch (tipo) {
    case 'gado-para-abate': return 'Gado p/ Abate';
    case 'materia-prima': return 'Matéria-Prima';
    case 'outros': return 'Outros';
    default: return tipo;
  }
}
