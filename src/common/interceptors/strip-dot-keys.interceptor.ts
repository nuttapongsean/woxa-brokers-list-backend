import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';

@Injectable()
export class StripDotKeysInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    const body = req['body'];

    if (body && typeof body === 'object') {
      const dotFields: Record<string, string> = {};
      const cleanBody: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(
        body as Record<string, unknown>,
      )) {
        if (key.includes('.')) {
          dotFields[key] = value as string;
        } else {
          cleanBody[key] = value;
        }
      }

      req['body'] = cleanBody;
      req['dotFields'] = dotFields;
    }

    return next.handle();
  }
}
