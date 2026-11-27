
import { useState } from "react";
import "./App.css";

const samples = [
  "Hello",
  "Hello world",
  "Artificial Intelligence",
  "I love programming.",
  "How are you today?",
  "The quick brown fox jumps over the lazy dog.",
  "React is a JavaScript library.",
  "1234567890",
  "Hello! How are you?",
  "こんにちは世界",
  "నమస్కారం ప్రపంచం",
  "🚀🤖💻",
];

function App() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const completed = Object.keys(results).length;

  const totalTokens = Object.values(results).reduce(
    (total, count) => total + count,
    0
  );

  const averageTokens = completed
    ? (totalTokens / completed).toFixed(2)
    : "—";

  async function countTokens() {
    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key.");
      return;
    }

    setLoading(true);
    setError("");
    setResults({});
    setShowKey(false);

    try {
      for (let i = 0; i < samples.length; i++) {
        const response = await fetch(`${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/count-tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
            text: samples[i],
          }),
          signal: AbortSignal.timeout(25000),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Token counting failed."
          );
        }

        if (!Number.isInteger(data.input_tokens)) {
          throw new Error("Invalid token count received.");
        }

        setResults((previous) => ({
          ...previous,
          [i]: data.input_tokens,
        }));
      }
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Backend unavailable. Start the Vercel development server."
          : err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setApiKey("");
    setError("");
    setResults({});
    setShowKey(false);
  }

  return (
    <main className="container">
      <header>
        <span className="brand">◈ TokenLab</span>
        <span className="tag">Powered by Anthropic</span>
      </header>

      <section className="hero">
        <h1>Every token counts.</h1>
        <p>
          Explore how Claude tokenizes different
          types of text.
        </p>
      </section>

      <section className="panel">
        <label htmlFor="api-key">
          Anthropic API Key
        </label>

        <div className="input-group">
          <input
            id="api-key"
            type={showKey ? "text" : "password"}
            placeholder="Enter your API key"
            value={apiKey}
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError("");
              setResults({});
            }}
          />

          <button
            className="secondary"
            disabled={loading}
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? "Hide" : "Show"}
          </button>

          <button
            className="secondary"
            disabled={loading}
            onClick={clearAll}
          >
            Clear
          </button>
        </div>

        <p className="hint">
          Your key is temporarily forwarded through
          our backend to Anthropic and is not
          persistently stored by the application.
        </p>

        <p className="hint">
          Model: Claude Opus 5.5
        </p>

        <button
          className="primary"
          onClick={countTokens}
          disabled={loading}
        >
          {loading
            ? `Counting tokens... ${completed}/${samples.length}`
            : "Count Tokens"}
        </button>

        {loading && (
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${(completed / samples.length) * 100}%`,
              }}
            />
          </div>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!loading && completed === samples.length && (
          <p className="success" role="status">
            ✓ Successfully counted all text samples.
          </p>
        )}
      </section>

      <section className="stats">
        <div className="stat">
          <span>Text samples</span>
          <h2>{samples.length}</h2>
        </div>

        <div className="stat">
          <span>Total tokens</span>
          <h2>{completed ? totalTokens : "—"}</h2>
        </div>

        <div className="stat">
          <span>Average tokens</span>
          <h2>{averageTokens}</h2>
        </div>
      </section>

      <section className="panel">
        <h2>Text Samples</h2>

        <p className="hint">
          Counts include model-specific message
          formatting and may differ from standalone
          text tokenization.
        </p>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Text</th>
              <th>Tokens</th>
            </tr>
          </thead>

          <tbody>
            {samples.map((text, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{text}</td>
                <td className="token">
                  {results[index] ??
                    (loading ? "Pending..." : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer>
        Built with React · Anthropic Token Counting API
      </footer>
    </main>
  );
}

export default App;
