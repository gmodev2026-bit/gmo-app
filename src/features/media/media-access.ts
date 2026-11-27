export function canAccessPrivateSupplierMedia(
  ownerUserId: string | null,
  session: { userId: string; role: string | null | undefined } | null
): boolean {
  return Boolean(
    session &&
      (session.role === 'admin' || session.userId === ownerUserId)
  );
}
