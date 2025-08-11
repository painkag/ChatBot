import { useState, useRef } from "react";

/*
  SYSTEM PROMPT: força o assistente a responder só sobre marketing.
  Ajuste conforme quiser.
*/
const SYSTEM_PROMPT =
  "Você é um especialista em marketing digital, tráfego pago e vendas online. " +
  "Responda ***apenas*** com informações, estratégias e táticas relacionadas a marketing, " +
  "gestão de anúncios, copywriting, funis de venda e métricas. Se a pergunta for fora de marketing, responda educadamente que só pode ajudar com marketing.";

export default function Chat({ apiKey, onClearKey }) {
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  async function sendMessage() {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);

    try {
      // construir mensagens para a API (inclui system prompt)
      const messagesForApi = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        { role: "user", content: userText },
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // pode trocar por outro modelo disponível
          messages: messagesForApi.map((m) => ({
            role: m.role === "assistant" ? "assistant" : m.role, // keep roles
            content: m.content,
          })),
          max_tokens: 600,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      const data = await res.json();
      const assistantText = data.choices?.[0]?.message?.content ?? "Sem resposta.";

      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    } catch (err) {
      console.error("Erro API:", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Erro: ${err.message || err}` },
      ]);
    } finally {
      setLoading(false);
      // rolar para baixo
      setTimeout(() => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div>Chat de Marketing</div>
        <div>
          <button className="btn small" onClick={() => { if (confirm("Limpar chave de API e sair?")) onClearKey(); }}>
            Sair
          </button>
        </div>
      </div>

      <div className="messages" ref={containerRef}>
        {messages.length === 0 && <div className="empty">Faça sua primeira pergunta sobre marketing.</div>}

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {loading && <div className="msg assistant"><div className="bubble">...</div></div>}
      </div>

      <div className="composer">
        <input
          className="input"
          placeholder="Pergunte sobre anúncios, funis, copy, métricas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
        />
        <button className="btn" onClick={sendMessage} disabled={loading}>
          {loading ? "Processando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
