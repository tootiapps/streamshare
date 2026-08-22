import os from 'node:os';

import { createApp } from './app.js';
import { loadLocalEnvironment } from './environment.js';

loadLocalEnvironment();

function localIp(): string {
    for (const interfaces of Object.values(os.networkInterfaces())) {
        for (const address of interfaces ?? []) {
            if (address.family === 'IPv4' && !address.internal) return address.address;
        }
    }
    return '127.0.0.1';
}

const host = process.env['HOST'] ?? '127.0.0.1';
const parsedPort = Number.parseInt(process.env['PORT'] ?? '4046', 10);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 4046;
const parsedAccessTokenExpiresIn = Number.parseInt(process.env['DEMO_AUTH_ACCESS_TOKEN_EXPIRES_IN'] ?? '', 10);
const app = await createApp({
    mediaUrl: process.env['DEMO_MEDIA_URL'],
    tmdbAccessToken: process.env['TMDB_ACCESS_TOKEN'],
    tmdbLanguage: process.env['TMDB_LANGUAGE'],
    authentication: (() => {
        const method = process.env['DEMO_AUTH_METHOD'];
        if (method === 'basic') return {
            method,
            username: process.env['DEMO_AUTH_USERNAME'],
            password: process.env['DEMO_AUTH_PASSWORD'],
        } as const;
        if (method === 'apikey') return { method, apiKey: process.env['DEMO_AUTH_API_KEY'] } as const;
        if (method === 'deviceCode') return {
            method,
            accessTokenExpiresIn: Number.isInteger(parsedAccessTokenExpiresIn) && parsedAccessTokenExpiresIn > 0
                ? parsedAccessTokenExpiresIn
                : undefined,
        } as const;
        return undefined;
    })(),
});

app.listen(port, host, () => {
    const advertisedHost = host === '0.0.0.0' ? localIp() : host;
    console.log(`StreamShare example service: http://${advertisedHost}:${port}`);
});
