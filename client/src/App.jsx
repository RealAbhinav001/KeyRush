import { useEffect, useState } from "react";
import axios from "axios";
import { getHealth } from "./api/health";

const FALLBACK_ERROR = "Can't reach the server. Try again.";

const App = () => {
  // One state, three possible shapes — impossible combinations can't exist.
  const [health, setHealth] = useState({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    const loadHealth = async () => {
      try {
        const data = await getHealth({ signal: controller.signal });
        setHealth({ status: "ok", data });
      } catch (error) {
        if (axios.isCancel(error)) return; // we cancelled it ourselves
        setHealth({
          status: "error",
          message: error.response?.data?.error ?? FALLBACK_ERROR,
        });
      }
    };

    loadHealth();

    return () => controller.abort();
  }, []);

  return (
    <main>
      {health.status === "loading" && <p>Loading…</p>}
      {health.status === "error" && <p role="alert">{health.message}</p>}
      {health.status === "ok" && <p>Server: {health.data.status}</p>}
    </main>
  );
};

export default App;
