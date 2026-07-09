import { BillingProfileForm } from "@/components/forms/billing-profile-form";
import { Container } from "@/components/layout/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <section className="py-8">
      <Container>
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Configurações
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Gerencie dados operacionais da conta e o perfil de cobrança usado pelo backend Burnix.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perfil de cobrança</CardTitle>
            <CardDescription>
              Dados Pix do organizador consumidos pelas rotas `/billing-profiles/me`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingProfileForm />
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
