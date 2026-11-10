/** Llama a Gemini (REST). `mensajes` = [{ rol: "user" | "model", contenido }]. */
export async function responder({ prompt, mensajes, modelo }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt }] },
      contents: mensajes.map(({ rol, contenido }) => ({ role: rol, parts: [{ text: contenido }] })),
      generationConfig: { maxOutputTokens: 1024 },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const texto = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  return texto || null;
}
