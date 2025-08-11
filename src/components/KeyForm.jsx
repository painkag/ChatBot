import { useState } from "react";

export default function KeyForm({ onSave }) {
  const [key, setKey] = useState("");

  return (
    <div className="card">
      <h2>Insira sua OpenAI API Key</h2>
      <p>
        Insira uma chave começando com <code>sk-</code>. Essa chave ficará salva no
        navegador (localStorage).
      </p>

      <input
        type="password"
        placeholder="sk-..."
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="input"
      />

      <div className="row">
        <button
          className="btn"
          onClick={() => {
            if (!key.trim()) return alert("Cole sua OpenAI API Key.");
            onSave(key.trim());
          }}
        >
          Salvar chave e ir ao chat
        </button>
      </div>

      <p className="note">
        Não compartilhe sua chave em computadores públicos. Se quiser, use uma chave
        com limites.
      </p>
    </div>
  );
}
