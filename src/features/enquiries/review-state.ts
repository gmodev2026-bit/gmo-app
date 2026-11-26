export type EnquiryReviewActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};
