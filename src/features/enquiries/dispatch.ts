export function isAllowedTargetSupplier(
  targetSupplierId: string | null,
  supplierId: string
) {
  return targetSupplierId === null || targetSupplierId === supplierId;
}

export function isValidDispatchSelection(
  targetSupplierId: string | null,
  supplierIds: readonly string[]
) {
  return (
    targetSupplierId === null ||
    (supplierIds.length === 1 &&
      isAllowedTargetSupplier(targetSupplierId, supplierIds[0]))
  );
}
