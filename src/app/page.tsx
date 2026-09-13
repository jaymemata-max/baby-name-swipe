const ENDPOINTS = [
  ["GET", "/api/me", "Profile, couple, partner, counters"],
  ["POST", "/api/couple", "Start a couple, get an invite code"],
  ["POST", "/api/couple/join", "Join with your partner's code"],
  ["GET", "/api/deck?gender=boy", "Next cards to swipe"],
  ["POST", "/api/swipes", "Record a swipe, find out if it matched"],
  ["DELETE", "/api/swipes", "Undo the last swipe"],
  ["GET", "/api/matches", "Names you both said yes to"],
  ["POST", "/api/names", "Add a name of your own"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <span className="text-4xl">👶</span>
        <h1 className="text-3xl font-semibold tracking-tight">Baby Name Swipe</h1>
        <p className="opacity-70">
          Backend is live. The swipe interface is the next step.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide opacity-60">API</h2>
        <ul className="flex flex-col divide-y divide-current/10 rounded-xl border border-current/10">
          {ENDPOINTS.map(([method, path, description]) => (
            <li key={`${method} ${path}`} className="flex flex-col gap-1 px-4 py-3">
              <code className="text-sm">
                <span className="opacity-50">{method}</span> {path}
              </code>
              <span className="text-sm opacity-60">{description}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
