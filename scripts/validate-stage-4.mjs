import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

const [
  paymentsService,
  pollingHook,
  pollingRules,
  format,
  proxy,
  successPage,
  failurePage,
  pendingPage,
] = await Promise.all([
  read("services/payments.ts"),
  read("hooks/useParticipantPaymentPolling.ts"),
  read("lib/participant-registration-query.ts"),
  read("lib/format.ts"),
  read("app/api/backend/[session]/[...path]/route.ts"),
  read("app/sucesso/page.tsx"),
  read("app/falha/page.tsx"),
  read("app/pendente/page.tsx"),
]);

assert.match(
  paymentsService,
  /\/participant\/registrations\/\$\{registrationId\}\/payments\/pix/
);
assert.doesNotMatch(paymentsService, /OPENPIX_APP_ID|NEXT_PUBLIC_OPENPIX|appId\s*:/i);

assert.match(pollingRules, /POLL_INTERVAL_MS = 4_500/);
assert.match(pollingRules, /POLL_DURATION_MS = 3 \* 60 \* 1_000/);
assert.match(pollingRules, /status === "paid"/);
assert.match(pollingRules, /status === "expired"/);
assert.match(pollingRules, /status === "error"/);
assert.match(pollingHook, /document\.visibilityState === "visible"/);
assert.match(pollingHook, /refetchIntervalInBackground: false/);
assert.match(pollingHook, /getMyRegistration/);
assert.doesNotMatch(pollingHook, /getPayment|\/payments\/\$\{.*payment/i);

for (const expected of [
  'pending: "Aguardando pagamento"',
  'paid: "Pagamento confirmado"',
  'expired: "Pix expirado"',
  'error: "Pagamento não concluído"',
  'not_required: "Evento gratuito"',
]) {
  assert.ok(format.includes(expected), `Status ausente: ${expected}`);
}

assert.ok(
  proxy.includes("participant\\/registrations\\/\\d+\\/payments\\/pix")
);
assert.ok(
  proxy.includes("participant\\/registrations(?:\\/\\d+)?")
);

for (const page of [successPage, failurePage, pendingPage]) {
  assert.match(page, /\/minhas-inscricoes/);
  assert.match(page, /registration_id/);
  assert.doesNotMatch(page, /correlation_id|checkout_id|payment_id/i);
  assert.doesNotMatch(page, /\/payments|\/dashboard|\/contracts/);
  assert.doesNotMatch(page, /GET \/|POST \/|OpenPix/i);
}

console.log("Etapa 4 validada: fluxo Pix do participante, polling e retornos seguros.");
