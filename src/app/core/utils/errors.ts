import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Check that the API is running.';
    return err.error?.message || fallback;
  }
  return fallback;
}
