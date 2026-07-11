import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { PublicPaymentRead } from "@/types/payment";

function getQrImageSrc(qrCodeBase64: string) {
  return qrCodeBase64.startsWith("data:image")
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

type PixPaymentBoxProps = {
  result: PublicPaymentRead;
  title?: string;
};

export function PixPaymentBox({
  result,
  title = "Pagamento Pix/OpenPix gerado",
}: PixPaymentBoxProps) {
  return (
    <Alert variant="success" title={title}>
      <div className="space-y-4">
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            Pagamento #{result.id} · Tentativa {result.attempt_number} · Status:{" "}
            {result.status}
          </p>
          <p>
            Valor: {formatCurrency(Number(result.amount), result.currency)}
          </p>
        </div>

        {result.checkout_url ? (
          <Button asChild variant="secondary" size="sm">
            <a href={result.checkout_url} target="_blank" rel="noreferrer">
              Abrir link de pagamento OpenPix
            </a>
          </Button>
        ) : null}

        {result.qr_code_base64 ? (
          <div className="max-w-xs rounded-2xl border border-green-200 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="QR Code Pix"
              className="h-auto w-full rounded-xl"
              src={getQrImageSrc(result.qr_code_base64)}
            />
          </div>
        ) : null}

        {result.copy_and_paste ? (
          <div>
            <p className="mb-1 text-sm font-medium">Código Pix copia e cola</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white p-3 text-xs text-slate-800">
              {result.copy_and_paste}
            </pre>
          </div>
        ) : null}

        <p className="text-xs leading-5 text-green-900/80">
          A confirmação definitiva é feita pelo backend após o webhook da OpenPix.
        </p>
      </div>
    </Alert>
  );
}
