import GuestGuard from "@/components/ui/guard/GuestGuard";
import RegisterForm from "@/components/ui/RegisterForm";

export default function RegisterPage() {
  return (
    <GuestGuard>
      <main>
        <RegisterForm />
      </main>
    </GuestGuard>
  );
}
