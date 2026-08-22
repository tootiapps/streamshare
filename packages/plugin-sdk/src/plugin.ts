import type { IPluginAPI } from './api';

/** Parameters supplied when a user invokes a manifest-declared addon action. */
export type PluginActionParameters = Readonly<Record<string, unknown>>;

/** Event delivered to an addon that subscribed through its manifest. */
export interface SystemEventContext<TData = unknown> {
  /** Public event name declared in the addon's subscriptions. */
  eventName: string;
  /** Unix timestamp in milliseconds recorded when the event was created. */
  timestamp: number;
  /** Event-specific payload. Addons must validate fields before using them. */
  data?: TData;
}

/**
 * Contract implemented by addons whose manifest type is `automation`.
 *
 * @example
 * ```ts
 * class ExampleAddon implements IAutomationPlugin {
 *   async onInit(api: IPluginAPI) {
 *     api.logger.info('Initialized');
 *   }
 *
 *   async onEvent(event: SystemEventContext) {
 *     // Handle subscribed events.
 *   }
 * }
 * ```
 */
export interface IAutomationPlugin<TEventData = unknown> {
  /** Called once after the host creates the addon script instance. */
  onInit(api: IPluginAPI): Promise<void>;
  /** Called when an event declared in the manifest is delivered. */
  onEvent(event: SystemEventContext<TEventData>): Promise<void>;
  /** Called when the user invokes an action declared in the manifest. */
  onAction?(params: PluginActionParameters, actionId: string): Promise<void>;
}
