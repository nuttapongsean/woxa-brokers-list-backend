import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const lang = I18nContext.current()?.lang;

    const raw = exception.message;
    const message = this.i18n.t(raw, { lang, defaultValue: raw });

    const body = exception.getResponse();
    const extra =
      typeof body === 'object' && body !== null
        ? Object.fromEntries(
            Object.entries(body as Record<string, unknown>).filter(
              ([k]) => k !== 'statusCode' && k !== 'message' && k !== 'error',
            ),
          )
        : {};

    response.status(status).json({ statusCode: status, message, ...extra });
  }
}
