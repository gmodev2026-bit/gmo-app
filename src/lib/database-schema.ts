export function getDatabaseSchema(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    return undefined;
  }

  return new URL(connectionString).searchParams.get('schema') ?? undefined;
}
