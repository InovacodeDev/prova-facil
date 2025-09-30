import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import fastify from 'fastify';

import { AppModule } from './app.module';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';

try {
    const dotenv = require('dotenv');
    const fs = require('fs');
    const path = require('path');

    const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../../.env'),
    ];
    console.log('[env] searching for .env files in monorepo candidates:', candidates);

    let loadedFrom: string | null = null;
    for (const p of candidates) {
        try {
            if (fs.existsSync(p)) {
                const res = dotenv.config({ path: p });
                if (res && !res.error) {
                    loadedFrom = p;
                    break;
                }
            }
        } catch (e) {
            // ignore and continue searching
        }
    }

    if (loadedFrom) {
        console.log(`[env] loaded environment variables from ${loadedFrom}`);
    } else {
        console.log('[env] no .env file loaded from monorepo candidates');
    }
} catch (e) {
    console.log('[env] dotenv not available or failed to load', e?.message || e);
}

async function bootstrap() {
    const rawTrustProxy = process.env.TRUST_PROXY;
    let trustProxy: boolean | number | string = 'loopback';
    if (typeof rawTrustProxy === 'string' && rawTrustProxy.trim() !== '') {
        const v = rawTrustProxy.trim().toLowerCase();
        if (v === 'true') trustProxy = true;
        else if (v === 'false') trustProxy = false;
        else if (!Number.isNaN(Number(v))) trustProxy = Number(v);
        else trustProxy = rawTrustProxy;
    }

    const fastifyInstance = fastify({ trustProxy, logger: false });

    if (process.env.NODE_ENV === 'production' && !process.env.COOKIE_SECRET) {
        throw new Error('COOKIE_SECRET must be set in production');
    }
    const cookieReg = fastifyInstance.register(fastifyCookie, {
        secret: process.env.COOKIE_SECRET || undefined,
    });
    const rateLimitReg = fastifyInstance.register(fastifyRateLimit, {
        max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
        timeWindow: '15 minutes',
    });
    await Promise.all([cookieReg, rateLimitReg]);

    const adapter = new FastifyAdapter(fastifyInstance as unknown as any);

    const app = await NestFactory.create(AppModule, adapter as any);
    
    const rawCors = process.env.API_CORS_ORIGINS ?? '';
    console.log('CORS allowed origins:', rawCors === '' ? '(none)' : rawCors);
    const allowedOrigins = rawCors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const corsOptions = {
        origin: (origin: string | undefined, callback: any) => {
            if (!origin) return callback(null, true);

            if (process.env.NODE_ENV === 'development') {
                if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                    return callback(null, true);
                }
            }

            if (allowedOrigins.length === 0) {
                if (process.env.NODE_ENV !== 'development') {
                    return callback(new Error('CORS not allowed'), false);
                }
                return callback(null, true);
            }

            const isAllowed = allowedOrigins.some((o) => {
                if (o === origin) return true;
                if (o.includes('*')) {
                    const re = new RegExp('^' + o.replace(/\*/g, '.*') + '$');
                    return re.test(origin);
                }
                return false;
            });
            return callback(isAllowed ? null : new Error('CORS not allowed'), isAllowed);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    };

    app.enableCors(corsOptions);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    app.useGlobalInterceptors(new RequestLoggerInterceptor());

    const extraScriptSrc = (process.env.CSP_EXTRA_SCRIPT_SRC ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const extraStyleSrc = (process.env.CSP_EXTRA_STYLE_SRC ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const extraConnectSrc = (process.env.CSP_EXTRA_CONNECT_SRC ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const cspDirectives: Record<string, Array<string>> = {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https:', ...extraScriptSrc],
        styleSrc: ["'self'", 'https:', ...extraStyleSrc],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:', ...extraConnectSrc],
        fontSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
    };

    await fastifyInstance.register(
        fastifyHelmet as unknown as import('fastify').FastifyPluginCallback,
        {
            contentSecurityPolicy: {
                directives: cspDirectives,
            },
        } as unknown as import('fastify').FastifyRegisterOptions<Record<string, never>>,
    );

    const apiPrefix = process.env.API_PREFIX ?? 'api';

    // Simple double-submit CSRF protection for state-changing routes.
    // It expects the client to send header 'x-csrf-token' with the value of the 'sb_csrf' cookie.
    fastifyInstance.addHook('preHandler', async (request, reply) => {
        const method = (request.raw.method || '').toUpperCase();
        // Only validate for state-changing methods
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            // allow certain public/auth routes to bypass CSRF since the client may not yet have cookies
            const rawUrl = (request.raw.url || request.url || '').toString();
            const bypassPaths = [
                `/api/auth/signin`,
                `/api/auth/signup`,
                `/api/auth/refresh`,
                `/api/auth/csrf`,
                `/api/auth/logout`,
                `/${apiPrefix}/auth/signin`,
                `/${apiPrefix}/auth/signup`,
                `/${apiPrefix}/auth/refresh`,
                `/${apiPrefix}/auth/csrf`,
                `/${apiPrefix}/auth/logout`,
            ];
            for (const p of bypassPaths) {
                if (rawUrl.startsWith(p)) return; // skip CSRF enforcement for these endpoints
            }

            const cookieHeader = request.headers.cookie || '';
            const cookies = cookieHeader.split(';').map((c: string) => c.trim()).filter(Boolean);
            const cookieMap: Record<string,string> = {};
            for (const c of cookies) {
                const [k, ...rest] = c.split('=');
                cookieMap[k] = rest.join('=');
            }
            const csrfCookie = cookieMap['sb_csrf'];

            // If running in development and CSRF is disabled, allow bypass via env var
            if (process.env.DISABLE_CSRF === 'true') return;

            // If there is no sb_csrf cookie present, this is likely an unauthenticated/public request
            // and cannot be exploited via cookie-based CSRF. Allow it. Only enforce the double-submit
            // check when a csrf cookie exists (i.e., user has a cookie-based session).
            if (!csrfCookie) return;

            const csrfHeader = (request.headers['x-csrf-token'] as string) || '';
            if (!csrfHeader || csrfCookie !== csrfHeader) {
                reply.code(403).send({ error: 'Invalid CSRF token' });
                return reply;
            }
        }
        return;
    });

    (app as any).setGlobalPrefix(apiPrefix);

    console.log('=== Start listening');
    const port = parseInt(process.env.API_PORT ?? '8801', 10);
    await (app as any).listen({ port, host: '0.0.0.0' });
    console.log('=== API started on port', port);
}

void bootstrap();
