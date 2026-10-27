"use client";

/** Last-resort boundary: replaces the root layout, so it must render its own html/body. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f6eee1", color: "#161311", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>The Smoky Mug</h1>
          <p style={{ marginBottom: "1.5rem" }}>Something broke loading the site. Call (804) 562-3722 if you need us right now.</p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#b3261e", color: "#fbf8f1", border: 0, borderRadius: 999, padding: "0.7rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: "1rem", fontSize: "0.75rem", opacity: 0.6 }}>Ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
