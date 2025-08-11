import { useState, useRef } from "react";

const SYSTEM_PROMPT =
  "Você é um especialista em marketing digital, tráfego pago e vendas online. " +
  "Responda ***apenas*** com informações, estratégias e táticas relacionadas a marketing, " +
  "gestão de anúncios, copywriting, funis de venda e métricas. Se a pergunta for fora de marketing, responda educadamente que só pode ajudar com marketing.";

export default function Chat({ apiKey, onClearKey }) {
  const [messages, setMessages] = useState([]); // histórico local
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
      // Concatenando system prompt + user text para enviar ao endpoint responses
      const prompt = SYSTEM_PROMPT + "\nUsuário: " + userText + "\nAssistente:";

      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: prompt,
          store: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      const data = await res.json();

      // Extrair a resposta correta no formato do novo endpoint
      // data.output é array de mensagens, pegar a primeira, texto dentro de content[0].text
      const assistantText =
        data.output?.[0]?.content?.[0]?.text || "Sem resposta.";

      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    } catch (err) {
      console.error("Erro API:", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Erro: ${err.message || err}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div>Chat de Marketing</div>
        <div>
          <button
            className="btn small"
            onClick={() => {
              if (confirm("Limpar chave de API e sair?")) onClearKey();
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <div className="messages" ref={containerRef}>
        {messages.length === 0 && (
          <div className="empty">Faça sua primeira pergunta sobre marketing.</div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role === "user" ? "user" : "assistant"}`}
          >
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="msg assistant">
            <div className="bubble">...</div>
          </div>
        )}
      </div>

      <div className="composer">
        <input
          className="input"
          placeholder="Pergunte sobre anúncios, funis, copy, métricas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button className="btn" onClick={sendMessage} disabled={loading}>
          {loading ? "Processando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
