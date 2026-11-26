export type EnquiryFormField =
  | 'categoryId'
  | 'cityId'
  | 'customerName'
  | 'customerPhone'
  | 'customerEmail'
  | 'preferredContact'
  | 'jobDescription'
  | 'urgency'
  | 'workType'
  | 'locationContext'
  | 'materialsResponsibility'
  | 'privacyNotice';

export type EnquiryActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  reference?: string;
  fieldErrors?: Partial<Record<EnquiryFormField, string>>;
};
