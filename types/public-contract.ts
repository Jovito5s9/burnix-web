import type { ContractStatus } from "@/types/contract";
import type { ContractFormField } from "@/types/form-field";

export type RegistrationAvailabilityState =
  | "open"
  | "deadline_passed"
  | "event_closed"
  | "event_cancelled"
  | "event_not_published"
  | "capacity_reached"
  | "not_started";

export type PublicContract = {
  id: number;
  title: string;
  description: string | null;
  status: ContractStatus;
  price: string;
  currency: string;
  capacity: number | null;

  /** Datas legadas preservadas pelo backend durante a transição temporal. */
  start_date: string | null;
  end_date: string | null;

  /** Timestamps precisos, quando expostos pelo contrato público. */
  start_at?: string | null;
  end_at?: string | null;
  timezone?: string;

  registration_deadline: string | null;
  registration_open: boolean;
  registration_state: RegistrationAvailabilityState;
  registration_closed_reason: string | null;
  registration_closed_message: string | null;
  server_time: string;
  remaining_capacity: number | null;
  form_fields: ContractFormField[];
};
