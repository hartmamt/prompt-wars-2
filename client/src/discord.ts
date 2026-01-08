import { DiscordSDK } from '@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

export const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

export interface DiscordAuth {
  user: DiscordUser;
  access_token: string;
}

let cachedAuth: DiscordAuth | null = null;

export const setupDiscord = async (): Promise<DiscordAuth | null> => {
  if (cachedAuth) {
    return cachedAuth;
  }

  try {
    await discordSdk.ready();

    const { code } = await discordSdk.commands.authorize({
      client_id: DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    });

    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = (await response.json()) as { access_token: string };

    const authResult = await discordSdk.commands.authenticate({ access_token });

    if (!authResult.user) {
      throw new Error('No user in auth result');
    }

    cachedAuth = {
      user: authResult.user as DiscordUser,
      access_token,
    };

    return cachedAuth;
  } catch (error) {
    console.error('Discord setup failed:', error);
    return null;
  }
};

export const isInDiscord = (): boolean => {
  return window.location.search.includes('frame_id=');
};

export const getDiscordUser = (): DiscordUser | null => {
  return cachedAuth?.user ?? null;
};
