/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        try {
            const ctx = context.switchToHttp();
            const req: any = ctx.getRequest?.();

            const method = req?.method ?? '<unknown-method>';
            const path = req?.originalUrl ?? req?.url ?? (req && req.route && req.route.path) ?? '<unknown-path>';
            const handlerName = (context.getHandler?.() as any)?.name ?? '<handler>';
            const controllerName = (context.getClass?.() as any)?.name ?? '<controller>';

            const body: any = req?.body !== undefined ? req.body : undefined;
            // const headers: any = req?.headers !== undefined ? req.headers : undefined;

            console.log('[API]', `${controllerName}.${handlerName}`, method, path);
            console.log('[API][BODY]', body);
            // console.log('[API][HEADERS]', headers);
        } catch (err: any) {
            console.log('[API][LOGGER][ERROR]', err?.message ?? err);
        }

        return next.handle();
    }
}
