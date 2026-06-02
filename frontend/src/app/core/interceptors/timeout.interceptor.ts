import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const DEFAULT_TIMEOUT = 30000; // 30 seconds

  return next(req).pipe(
    timeout(DEFAULT_TIMEOUT)
  );
};
