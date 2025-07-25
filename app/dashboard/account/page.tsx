"use client";

import { useAuth } from "@/hooks/use-auth";
import { AccountForm } from "./components/account-form";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from '@/lib/firebase';
import { AuthProvider } from "@/contexts/auth-context";

const AccountPageContent = () => {
    const { user, loading } = useAuth();
    const firebaseUser = auth.currentUser;

    if (loading || !user || !firebaseUser) {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Minha Conta</h3>
                    <p className="text-sm text-muted-foreground">
                        Atualize as configurações da sua conta e defina uma nova senha.
                    </p>
                </div>
                <div className="w-full border-t border-muted"></div>
                <div className="space-y-8 max-w-2xl">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    const fullUserData = {
        ...user,
        email: firebaseUser.email,
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Minha Conta</h3>
                <p className="text-sm text-muted-foreground">
                    Atualize as configurações da sua conta e defina uma nova senha.
                </p>
            </div>
            <div className="w-full border-t border-muted"></div>
            <AccountForm currentUserData={fullUserData} />
        </div>
    );
}

export default function AccountPage() {
    return (
        <AuthProvider>
            <AccountPageContent />
        </AuthProvider>
    );
}
