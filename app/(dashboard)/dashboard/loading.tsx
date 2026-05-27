import { Container } from "@/components/layout/container";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="py-16">
      <Container>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner label="Carregando dashboard..." />
        </div>
      </Container>
    </div>
  );
}
