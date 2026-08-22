import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Load developer-only files without overriding environment variables supplied by
 * the host, container, process manager or CI environment.
 */
export function loadLocalEnvironment(root = packageRoot): void {
    for (const filename of ['.env.local', '.env']) {
        config({
            path: path.join(root, filename),
            override: false,
            quiet: true,
        });
    }
}
