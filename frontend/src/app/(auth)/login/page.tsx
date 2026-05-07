import GuestGuard from "@/components/ui/guard/GuestGuard";
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <GuestGuard>
      <main>
        <LoginForm />
      </main>
    </GuestGuard>
  );
}
