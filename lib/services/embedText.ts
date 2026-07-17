import { Ollama } from "ollama";

const MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

export async function embedText(text: string): Promise<number[]> {
  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
  });

  const result = await ollama.embed({
    model: MODEL,
    input: text,
  });

  // SDK may return embeddings: number[][] — take the first vector
  const vector = result.embeddings[0];
  if (!vector?.length) {
    throw new Error("Ollama returned an empty embedding");
  }
  return vector;
}
