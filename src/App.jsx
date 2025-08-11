import { useState } from "react";
import KeyForm from "./components/KeyForm";
import Chat from "./components/Chat";

export default function App() {
  const savedKey = localStorage.getItem("OPENAI_KEY") || "";
  const [apiKey, setApiKey] = useState(savedKey);

  function handleSaveKey(key) {
    localStorage.setItem("OPENAI_KEY", key);
    setApiKey(key);
  }

  function handleClearKey() {
    localStorage.removeItem("OPENAI_KEY");
    setApiKey("");
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Chat de Marketing — Acesse com sua OpenAI Key</h1>
      </header>

      <main className="container">
        {apiKey ? (
          <Chat apiKey={apiKey} onClearKey={handleClearKey} />
        ) : (
          <KeyForm onSave={handleSaveKey} />
        )}
      </main>

      <footer className="footer">
        <small>
          Sua chave é usada somente no seu navegador. Você é responsável pelo uso e
          custos da OpenAI.
        </small>
      </footer>
    </div>
  );
}
