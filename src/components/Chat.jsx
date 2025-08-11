import { useState, useRef } from "react";

const SYSTEM_PROMPT =
  "Você é um especialista em marketing digital, tráfego pago e vendas online. " +
  "Responda ***apenas*** com informações, estratégias e táticas relacionadas a marketing, " +
  "gestão de anúncios, copywriting, funis de venda e métricas. Se a pergunta for fora de marketing, responda educadamente que só pode ajudar com marketing.\n\n" +
  "Antes de começar, peça ao usuário para informar qual é o negócio dele e o que ele precisa, " +
  "para que suas respostas sejam objetivas e úteis desde a primeira pergunta, já que o serviço é limitado. " +
  "E pergunte onde que ele deseja anunciar! No meta: Facebook e Instagram, Google Ads ou ambos.";

export default function Chat({ apiKey, onClearKey }) {
  const [messages, setMessages] = useState([]); // mantém o histórico local
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  async function sendMessage() {
    const userText = input.trim();
    if (!userText) return; // evita enviar vazio

    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);

    // Configurar abort controller para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    try {
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
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Você é um assistente que responde sempre em **Markdown** com títulos, listas e destaque visual.
Deixe as respostas claras e organizadas, com frases curtas e espaços entre as linhas para facilitar a leitura.
Separe os tópicos em linhas pequenas, com no máximo 2 linhas por parágrafo.`,
            },
            ...messagesForApi,
          ],
          max_tokens: 600,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      const data = await res.json();

      const assistantText = data.choices?.[0]?.message?.content ?? "Sem resposta.";

      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    } catch (err) {
      clearTimeout(timeoutId);

      let friendlyMessage = "Erro inesperado. Tente novamente mais tarde.";

      if (err.name === "AbortError") {
        friendlyMessage = "Tempo de resposta esgotado. Tente novamente mais tarde.";
      } else {
        try {
          const errObj = JSON.parse(err.message);
          if (errObj.error) {
            const code = errObj.error.code;
            if (code === "insufficient_quota") {
              friendlyMessage =
                "Você excedeu sua cota atual. Por favor, verifique seu plano e pagamento.";
            } else if (code === "invalid_api_key") {
              friendlyMessage =
                "Chave de API inválida. Por favor, verifique sua chave no painel do OpenAI.";
            } else {
              friendlyMessage = errObj.error.message || friendlyMessage;
            }
          }
        } catch {
          friendlyMessage = err.message || friendlyMessage;
        }
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Erro: ${friendlyMessage}` },
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
          maxLength={500} // limita o input a 500 chars
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
