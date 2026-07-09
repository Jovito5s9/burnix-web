import type { AxiosResponse } from "axios";

import { api } from "@/services/api";

export type CsvExportResult = {
  blob: Blob;
  filename: string;
};

function getHeaderValue(headers: AxiosResponse<Blob>["headers"], name: string) {
  const value = headers[name] ?? headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function extractFilename(response: AxiosResponse<Blob>, fallback: string) {
  const contentDisposition = getHeaderValue(response.headers, "content-disposition");

  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? fallback;
}

async function downloadCsv(endpoint: string, fallbackFilename: string): Promise<CsvExportResult> {
  const response = await api.get<Blob>(endpoint, {
    responseType: "blob",
    headers: {
      Accept: "text/csv",
    },
  });

  return {
    blob: response.data,
    filename: extractFilename(response, fallbackFilename),
  };
}

export async function exportRegistrationsCsv(contractId: string | number) {
  return downloadCsv(
    `/contracts/${contractId}/export/registrations.csv`,
    `evento-${contractId}-inscricoes.csv`
  );
}

export async function exportPaymentsCsv(contractId: string | number) {
  return downloadCsv(
    `/contracts/${contractId}/export/payments.csv`,
    `evento-${contractId}-pagamentos.csv`
  );
}
