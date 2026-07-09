import type { ContractStatus } from "@/types/contract";
import type { ContractFormField } from "@/types/form-field";

export type PublicContract = {
  id: number;
  title: string;
  description: string | null;
  status: ContractStatus;
  price: string;
  currency: string;
  capacity: number | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  form_fields: ContractFormField[];
};
