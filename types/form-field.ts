export type ContractFormField = {
  id: number;
  contract_id: number;
  field_key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options: unknown[] | Record<string, unknown> | null;
  validation_rules: Record<string, unknown> | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export type ContractFormFieldPayload = {
  field_key: string;
  label: string;
  type: string;
  required?: boolean;
  order?: number;
  options?: unknown[] | Record<string, unknown> | null;
  validation_rules?: Record<string, unknown> | null;
};

export type ContractFormFieldUpdatePayload = Partial<ContractFormFieldPayload>;

export type DynamicFormValues = Record<string, unknown>;
