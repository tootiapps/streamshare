import type {IAutomationPlugin} from './plugin';
import type {ISourcePlugin} from './source';

/** Addon contracts that can currently be registered with the StreamShare host. */
export type StreamShareAddon = IAutomationPlugin | ISourcePlugin;

/**
 * Registers an addon instance with the StreamShare runtime.
 *
 * Call this once from the package entry point after creating the addon instance.
 *
 * @throws When the bundle is executed outside a StreamShare addon runtime.
 */
export function registerPlugin(addon: StreamShareAddon): void {
  const host = globalThis as typeof globalThis & {
    registerPlugin?: (value: StreamShareAddon) => void;
  };

  if (typeof host.registerPlugin !== 'function') {
    throw new Error('StreamShare addon runtime is not available.');
  }

  host.registerPlugin.call(globalThis, addon);
}
