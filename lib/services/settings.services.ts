// lib/services/settings.services.ts
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { companyInfoSchema, CompanyInfo } from "@/lib/schemas";

// Ref do documento de configurações fiscais e cadastrais da empresa
const settingsDocRef = doc(db, "settings", "companyInfo");

/**
 * Salva/atualiza as informações cadastrais e fiscais da empresa no Firestore.
 * - ATENÇÃO: Valide os dados ANTES de chamar esta função! (use o schema no frontend)
 * - O merge:true garante que só campos enviados serão atualizados.
 */
export const saveCompanyInfo = async (data: CompanyInfo) => {
  await setDoc(settingsDocRef, data, { merge: true });
};

/**
 * Busca os dados fiscais/cadastrais da empresa no Firestore.
 * - Garante sempre retornar no formato tipado e validado.
 */
export const getCompanyInfo = async (): Promise<CompanyInfo | null> => {
  const docSnap = await getDoc(settingsDocRef);
  if (docSnap.exists()) {
    // Validação extra de tipo (por segurança!)
    const parsedData = companyInfoSchema.safeParse(docSnap.data());
    if (parsedData.success) {
      return parsedData.data;
    }
  }
  return null;
};

// Exporta o schema central para reutilização consistente em formulários/validações
export { companyInfoSchema };
