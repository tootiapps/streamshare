import type {
    DeviceCodeServiceAuthentication,
    ServiceAuthentication,
    ServiceDeviceAuthorization,
    ServiceDeviceTokenRequest,
    ServiceDeviceTokenResponse,
    ServiceRefreshTokenRequest,
    ServiceTokenGrant,
} from '@streamshare/service';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type DemoAuthenticationOptions =
    | { method: 'basic'; username?: string; password?: string }
    | { method: 'apikey'; apiKey?: string }
    | { method: 'deviceCode'; accessTokenExpiresIn?: number };

export interface DemoAuthentication {
    manifest?: ServiceAuthentication;
    authorize: RequestHandler;
    registerRoutes(register: {
        post(path: string, handler: RequestHandler): unknown;
        get(path: string, handler: RequestHandler): unknown;
    }): void;
}

interface DeviceChallenge {
    deviceCode: string;
    userCode: string;
    expiresAt: number;
    authorized: boolean;
}

function opaqueToken(bytes = 24): string {
    return randomBytes(bytes).toString('base64url');
}

function sameSecret(actual: string | undefined, expected: string): boolean {
    if (!actual) return false;
    const actualBytes = Buffer.from(actual);
    const expectedBytes = Buffer.from(expected);
    return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function unauthorized(response: Response): void {
    response.status(401).json({ error: 'Authentication required' });
}

function noRoutes(): void {
    // Static authentication methods do not expose authorization endpoints.
}

export function createDemoAuthentication(options?: DemoAuthenticationOptions): DemoAuthentication {
    if (!options) {
        return {
            authorize: (_request, _response, next) => next(),
            registerRoutes: noRoutes,
        };
    }

    if (options.method === 'basic') {
        const username = options.username ?? 'demo';
        const password = options.password ?? 'demo';
        const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        return {
            manifest: { method: 'basic' },
            authorize: (request, response, next) => {
                if (!sameSecret(request.get('authorization'), expected)) return unauthorized(response);
                next();
            },
            registerRoutes: noRoutes,
        };
    }

    if (options.method === 'apikey') {
        const expected = `Bearer ${options.apiKey ?? 'demo-api-key'}`;
        return {
            manifest: { method: 'apikey' },
            authorize: (request, response, next) => {
                if (!sameSecret(request.get('authorization'), expected)) return unauthorized(response);
                next();
            },
            registerRoutes: noRoutes,
        };
    }

    const manifest: DeviceCodeServiceAuthentication = {
        method: 'deviceCode',
        deviceAuthorizationPath: '/auth/device',
        tokenPath: '/auth/token',
    };
    const challenges = new Map<string, DeviceChallenge>();
    const userCodes = new Map<string, DeviceChallenge>();
    const accessTokens = new Map<string, number>();
    const refreshTokens = new Set<string>();
    const accessTokenExpiresIn = options.accessTokenExpiresIn ?? 3600;

    const grant = (): ServiceTokenGrant => {
        const accessToken = opaqueToken();
        const refreshToken = opaqueToken();
        accessTokens.set(accessToken, Date.now() + accessTokenExpiresIn * 1000);
        refreshTokens.add(refreshToken);
        return { accessToken, refreshToken, expiresIn: accessTokenExpiresIn };
    };

    const registerRoutes: DemoAuthentication['registerRoutes'] = (app) => {
        app.post(manifest.deviceAuthorizationPath, (request, response) => {
            const deviceCode = opaqueToken();
            const userCode = randomBytes(4).toString('hex').toUpperCase();
            const challenge: DeviceChallenge = {
                deviceCode,
                userCode,
                expiresAt: Date.now() + 10 * 60 * 1000,
                authorized: false,
            };
            challenges.set(deviceCode, challenge);
            userCodes.set(userCode, challenge);

            const origin = `${request.protocol}://${request.get('host')}`;
            const verificationUrl = `${origin}/auth/activate`;
            const result: ServiceDeviceAuthorization = {
                deviceCode,
                userCode,
                verificationUrl,
                verificationUrlComplete: `${verificationUrl}?code=${encodeURIComponent(userCode)}`,
                expiresIn: 600,
                interval: 1,
            };
            response.json(result);
        });

        app.get('/auth/activate', (request, response) => {
            const code = typeof request.query['code'] === 'string' ? request.query['code'] : '';
            response.type('html').send(`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Authorize StreamShare demo service</title>
<body><main><h1>Authorize the demo service</h1>
<form method="post" action="/auth/activate">
<label>Code <input name="code" value="${code.replace(/[&<>"']/g, '')}" required></label>
<button type="submit">Authorize</button>
</form></main></body></html>`);
        });

        app.post('/auth/activate', (request, response) => {
            const code = typeof request.body?.code === 'string' ? request.body.code.toUpperCase() : '';
            const challenge = userCodes.get(code);
            if (!challenge || challenge.expiresAt <= Date.now()) {
                response.status(404).json({ error: 'Unknown or expired code' });
                return;
            }
            challenge.authorized = true;
            response.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><title>Authorized</title><body><p>Authorization complete. You can return to StreamShare.</p></body></html>');
        });

        app.post(manifest.tokenPath, (request, response) => {
            const body = request.body as Partial<ServiceDeviceTokenRequest> | Partial<ServiceRefreshTokenRequest>;
            if (body.grantType === 'refresh_token') {
                if (!body.refreshToken || !refreshTokens.delete(body.refreshToken)) {
                    return unauthorized(response);
                }
                response.json(grant());
                return;
            }

            if (body.grantType !== 'urn:ietf:params:oauth:grant-type:device_code' || !body.deviceCode) {
                response.status(400).json({ error: 'Invalid token request' });
                return;
            }
            const challenge = challenges.get(body.deviceCode);
            let result: ServiceDeviceTokenResponse;
            if (!challenge || challenge.expiresAt <= Date.now()) {
                result = { status: 'expired' };
            } else if (!challenge.authorized) {
                result = { status: 'pending' };
            } else {
                challenges.delete(body.deviceCode);
                userCodes.delete(challenge.userCode);
                result = { status: 'authorized', ...grant() };
            }
            response.json(result);
        });
    };

    return {
        manifest,
        authorize: (request: Request, response: Response, next: NextFunction) => {
            const header = request.get('authorization');
            const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
            const expiresAt = token ? accessTokens.get(token) : undefined;
            if (!token || !expiresAt || expiresAt <= Date.now()) {
                if (token) accessTokens.delete(token);
                return unauthorized(response);
            }
            next();
        },
        registerRoutes,
    };
}
