import { useEffect, useState } from 'react';
import { socket, connectSocket } from './socket';
import { setupDiscord, isInDiscord, type DiscordUser } from './discord';

function App() {
  const [connected, setConnected] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Set up Discord if in Discord iframe
      if (isInDiscord()) {
        const auth = await setupDiscord();
        if (auth) {
          setDiscordUser(auth.user);
        }
      }

      // Connect to Socket.io server
      connectSocket();
      setLoading(false);
    };

    void init();

    // Socket event listeners
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Check if already connected
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompt-black">
        <div className="text-prompt-purple text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-prompt-black p-4">
      <h1 className="mb-8 text-4xl font-bold text-prompt-purple md:text-6xl">
        PROMPT WARS
      </h1>

      <div className="mb-4 flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            connected ? 'bg-prompt-green' : 'bg-red-500'
          }`}
        />
        <span className="text-gray-400">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {discordUser && (
        <div className="mb-4 text-gray-400">
          Logged in as: <span className="text-prompt-pink">{discordUser.global_name ?? discordUser.username}</span>
        </div>
      )}

      <div className="w-full max-w-md space-y-4 px-4 md:max-w-lg">
        <button className="w-full rounded-lg bg-prompt-purple px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25">
          CREATE ROOM
        </button>
        <button className="w-full rounded-lg border-2 border-prompt-pink bg-transparent px-6 py-4 text-lg font-bold text-prompt-pink transition-all hover:bg-prompt-pink hover:text-white">
          JOIN ROOM
        </button>
      </div>
    </div>
  );
}

export default App;
