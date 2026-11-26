export const FREE_PILOT_ASSIGNMENT_LIMIT = 5;

export function isFreePilotQuotaExhausted(committedAssignments: number) {
  return committedAssignments >= FREE_PILOT_ASSIGNMENT_LIMIT;
}
