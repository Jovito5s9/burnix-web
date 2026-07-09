"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFormField,
  deleteFormField,
  getFormField,
  listFormFields,
  updateFormField,
} from "@/services/form-fields";
import type {
  ContractFormFieldPayload,
  ContractFormFieldUpdatePayload,
} from "@/types/form-field";

export function useFormFields(contractId: string | number) {
  return useQuery({
    queryKey: ["contracts", contractId, "form-fields"],
    queryFn: () => listFormFields(contractId),
    enabled: Boolean(contractId),
    staleTime: 30 * 1000,
  });
}

export function useFormField(
  contractId: string | number,
  fieldId: string | number
) {
  return useQuery({
    queryKey: ["contracts", contractId, "form-fields", fieldId],
    queryFn: () => getFormField(contractId, fieldId),
    enabled: Boolean(contractId) && Boolean(fieldId),
    staleTime: 30 * 1000,
  });
}

export function useCreateFormField(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContractFormFieldPayload) =>
      createFormField(contractId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "form-fields"],
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts", contractId] });
    },
  });
}

export function useUpdateFormField(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fieldId,
      payload,
    }: {
      fieldId: string | number;
      payload: ContractFormFieldUpdatePayload;
    }) => updateFormField(contractId, fieldId, payload),
    onSuccess: async (field) => {
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "form-fields"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "form-fields", field.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts", contractId] });
    },
  });
}

export function useDeleteFormField(contractId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: string | number) => deleteFormField(contractId, fieldId),
    onSuccess: async (_data, fieldId) => {
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "form-fields"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contracts", contractId, "form-fields", fieldId],
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts", contractId] });
    },
  });
}
