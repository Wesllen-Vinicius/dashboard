import { auth } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import { LoginValues } from '@/lib/schemas';

// CORREÇÃO: A função agora aceita dois argumentos de string, em vez de um objeto.
export const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
};

export const logout = async () => {
    return signOut(auth);
};

export const createUserInAuth = async (email: string, password: string): Promise<string> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user.uid;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este e-mail já está em uso por outra conta.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A senha é muito fraca. Deve ter no mínimo 6 caracteres.");
        }
        console.error("Erro ao criar usuário na autenticação:", error);
        throw new Error('Não foi possível criar o acesso para o usuário.');
    }
};

export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const reauthenticateUser = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("Usuário não encontrado ou sem e-mail associado.");

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
};

export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
