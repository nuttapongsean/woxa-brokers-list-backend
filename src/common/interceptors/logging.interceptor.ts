import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const query = req.query as Record<string, unknown>;
    const params = req.params as Record<string, unknown>;
    const body = req.body as Record<string, unknown>;
    const start = Date.now();

    this.logger.log(`→ ${method} ${url}`);
    if (Object.keys(query).length)
      this.logger.debug(`  query    ${JSON.stringify(query)}`);
    if (Object.keys(params).length)
      this.logger.debug(`  params   ${JSON.stringify(params)}`);
    if (body && Object.keys(body).length)
      this.logger.debug(`  body     ${JSON.stringify(body)}`);

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const res = context.switchToHttp().getResponse<Response>();
          const ms = Date.now() - start;
          this.logger.log(`← ${method} ${url} ${res.statusCode} +${ms}ms`);
          if (data !== undefined && data !== null)
            this.logger.debug(`  response ${JSON.stringify(data)}`);
        },
        error: (err: {
          status?: number;
          errors?: unknown;
          getResponse?: () => unknown;
          message?: unknown;
        }) => {
          const ms = Date.now() - start;
          const status = err?.status ?? 500;
          const res =
            typeof err?.getResponse === 'function' ? err.getResponse() : null;
          const detail =
            res && typeof res === 'object'
              ? res
              : (err?.errors ?? res ?? err?.message);
          this.logger.error(
            `← ${method} ${url} ${status} +${ms}ms`,
            JSON.stringify(detail),
          );
        },
      }),
    );
  }
}
