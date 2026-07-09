import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { PaymentPixResponse } from "@/types/payment";

function getQrImageSrc(qrCodeBase64: string) {
  return qrCodeBase64.startsWith("data:image")
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

type PixPaymentBoxProps = {
  result: PaymentPixResponse;
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
            Pagamento #{result.payment.id} · Status: {result.payment.status}
          </p>
          <p>
            Valor: {formatCurrency(Number(result.payment.amount), result.payment.currency)}
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

        <p className="text-xs leading-5 text-green-900/80">
          A confirmação definitiva acontece no backend após o webhook OpenPix e pode ser conferida nos endpoints de pagamentos.
        </p>

        {result.copy_and_paste ? (
          <div>
            <p className="mb-1 text-sm font-medium">Código Pix copia e cola</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white p-3 text-xs text-slate-800">
              {result.copy_and_paste}
            </pre>
          </div>
        ) : result.qr_code ? (
          <div>
            <p className="mb-1 text-sm font-medium">BR Code Pix</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white p-3 text-xs text-slate-800">
              {result.qr_code}
            </pre>
          </div>
        ) : null}
      </div>
    </Alert>
  );
}
