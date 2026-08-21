import {
  type IAutomationPlugin,
  type IPluginAPI,
  type PluginActionParameters,
  registerPlugin,
  type SystemEventContext,
} from '@streamshare/plugin-sdk';

class HelloAddon implements IAutomationPlugin {
  private api!: IPluginAPI;

  async onInit(api: IPluginAPI): Promise<void> {
    this.api = api;
    this.api.logger.info('Hello addon initialized.');
  }

  async onEvent(event: SystemEventContext): Promise<void> {
    if (event.eventName === 'app:started') {
      this.api.logger.info('StreamShare started.');
    }
  }

  async onAction(params: PluginActionParameters, actionId: string): Promise<void> {
    if (actionId !== 'say_hello') {
      return;
    }

    const config = await this.api.getConfig();
    const greeting = config['greeting'] || 'Hello';
    const recipient = typeof params['recipient'] === 'string' ? params['recipient'] : 'StreamShare';

    this.api.toast({
      message: `${greeting}, ${recipient}!`,
      color: 'success',
      duration: 3000,
    });
  }
}

registerPlugin(new HelloAddon());
