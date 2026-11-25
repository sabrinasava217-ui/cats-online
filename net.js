// Lapisan multiplayer (Supabase Realtime: Broadcast + Presence). Belum dipasang ke GameScene (Tahap 3).
// Satu "room" = satu channel. Tepat 2 pemain: yang masuk lebih dulu = kucing PINK, kedua = HIJAU.
const Net = (() => {
  const myId = Math.random().toString(36).slice(2, 10);
  let client = null, channel = null, handlers = {};

  function connect() {
    const c = window.CATS_CONFIG || {};
    if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY) throw new Error('Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/config.js');
    client = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 20 } }
    });
  }

  // h: { onReady(id), onPlayers({count, role}), onFull(), onState(s), onEvent(e), onError(status) }
  function joinRoom(code, h) {
    handlers = h || {};
    if (!client) connect();
    leave();
    channel = client.channel('cats-' + String(code).toUpperCase(), {
      config: { broadcast: { self: false }, presence: { key: myId } }
    });
    channel.on('presence', { event: 'sync' }, () => {
      const st = channel.presenceState();
      const ids = Object.keys(st).sort((a, b) => (st[a][0].t - st[b][0].t) || a.localeCompare(b));
      const idx = ids.indexOf(myId);
      if (idx >= 2) { handlers.onFull && handlers.onFull(); return; }
      handlers.onPlayers && handlers.onPlayers({ count: Math.min(ids.length, 2), role: idx === 0 ? 'pink' : 'green' });
    });
    channel.on('broadcast', { event: 'state' }, ({ payload }) => handlers.onState && handlers.onState(payload));
    channel.on('broadcast', { event: 'game' }, ({ payload }) => handlers.onEvent && handlers.onEvent(payload));
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ t: Date.now() });
        handlers.onReady && handlers.onReady(myId);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        handlers.onError && handlers.onError(status);
      }
    });
  }

  // Posisi kucing sendiri, kirim ~15x/detik: { x, y, vx, vy, flip }
  const sendState = (s) => channel && channel.send({ type: 'broadcast', event: 'state', payload: s });
  // Kejadian: { type: 'key' } | { type: 'respawn' } | { type: 'restart' }
  const sendEvent = (e) => channel && channel.send({ type: 'broadcast', event: 'game', payload: e });
  function leave() { if (channel && client) client.removeChannel(channel); channel = null; }

  return { joinRoom, sendState, sendEvent, leave, get id() { return myId; } };
})();
