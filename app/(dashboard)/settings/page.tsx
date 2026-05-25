import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";

export default function SettingsPage() {
  return (
    <section className="py-8">
      <Container>
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Preferências da conta, perfil e ajustes de operação.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Estrutura reservada para futuras configurações de usuário e empresa.
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
