// lib/utils/formatters.ts

export const formatCpfCnpj = (value: string) => {
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

// ADICIONE ESTA NOVA FUNÇÃO
export const formatCep = (value: string | null | undefined): string => {
  if (!value) return '';
  const cleanedValue = value.replace(/\D/g, '');

  if (cleanedValue.length === 8) {
    return cleanedValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  return value;
};
