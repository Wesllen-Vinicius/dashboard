import { BrandingPanel } from "./components/branding-panel";
import { LoginForm } from "./components/login-form";
import { ModeToggle } from "@/components/modeToggle";

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">

      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ModeToggle />
      </div>

      <BrandingPanel />

      <div className="lg:p-8">
        <LoginForm />
      </div>
    </div>
  );
}
