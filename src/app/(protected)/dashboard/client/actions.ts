'use server';

import { requestClientDeletion, updateClientProfile } from '@/server/clients';

type ClientActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

export async function updateClientProfileAction(
  _previousState: ClientActionState,
  formData: FormData
) {
  return updateClientProfile(formData);
}

export async function requestClientDeletionAction(
  _previousState: ClientActionState,
  formData: FormData
) {
  return requestClientDeletion(formData);
}
