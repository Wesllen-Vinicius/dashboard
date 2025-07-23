import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';



/**
 * Remove todos os caracteres não numéricos de uma string.
 * @param value
 * @returns
 */
export const unmask = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

export const formatCpfCnpj = (value: string | null | undefined): string => {
  if (!value) return '';
  const cleanedValue = value.replace(/\D/g, '');

  if (cleanedValue.length === 11) {
    return cleanedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  if (cleanedValue.length === 14) {
    return cleanedValue.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  }

  return value;
};

export const formatCep = (value: string | null | undefined): string => {
  if (!value) return '';
  const cleanedValue = value.replace(/\D/g, '');

  if (cleanedValue.length === 8) {
    return cleanedValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  return value;
};

export const formatPhone = (value: string | null | undefined): string => {
    if (!value) return '';
    const cleanedValue = value.replace(/\D/g, '');

    if (cleanedValue.length === 11) {
        return cleanedValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleanedValue.length === 10) {
        return cleanedValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    if (cleanedValue.length === 9) {
        return cleanedValue.replace(/(\d{5})(\d{4})/, '$1-$2');
    }
    if (cleanedValue.length === 8) {
        return cleanedValue.replace(/(\d{4})(\d{4})/, '$1-$2');
    }

    return value;
}

export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || typeof value === 'undefined') {
        return 'R$ 0,00';
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (date: any): string => {
    if (!date) return 'N/A';

    let dateObject: Date;

    if (date instanceof Timestamp) {
        dateObject = date.toDate();
    } else if (date instanceof Date) {
        dateObject = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
        dateObject = new Date(date);
    } else {
        return 'Data inválida';
    }

    if (isNaN(dateObject.getTime())) {
        return 'Data inválida';
    }

    return format(dateObject, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
};
