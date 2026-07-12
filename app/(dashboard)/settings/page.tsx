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
            Atualize os dados da sua conta e as informações usadas para receber pagamentos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados de recebimento</CardTitle>
            <CardDescription>
              Cadastre a chave Pix e os dados do responsável pelo recebimento.
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
