import { useCompanies } from "../hooks/useHealth";

export default function Home() {
  const { data, isLoading, error } = useCompanies();

  return (
    <div className="card">
      <h1>Backend connectivity check</h1>
      <p className="muted">
        If you see companies below, the whole chain works:
        Vite → Supabase client → Postgres → RLS → return.
      </p>

      {isLoading && <p>Loading…</p>}
      {error     && <p className="error">Error: {(error as Error).message}</p>}

      {data && (
        <ul className="list">
          {data.map((c) => (
            <li key={c.id}>
              <strong>{c.name}</strong>{" "}
              <span className={c.is_enabled ? "tag ok" : "tag off"}>
                {c.is_enabled ? "enabled" : "disabled"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
