export interface ValidationError {
  status?: string;
  code?: string;
  title?: string;
  meta?: string;
  detail: string;
  source?: {
    parameter?: string;
    pointer?: string;
  };
}
