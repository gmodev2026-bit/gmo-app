export type SupplierActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export type SupplierMutationResult =
  { success: true; supplierId: string } | { success: false; message: string };
