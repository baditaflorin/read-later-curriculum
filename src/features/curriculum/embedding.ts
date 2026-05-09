import { normalizeVector, tokenize } from "../../shared/text";

const HASH_DIMENSIONS = 96;
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

export interface EmbeddingResult {
  vectors: number[][];
  provider:
    | "hash-local"
    | "sentence-transformers"
    | "sentence-transformers-fallback";
}

export interface EmbeddingProgress {
  completed: number;
  total: number;
  detail: string;
}

type ProgressCallback = (progress: EmbeddingProgress) => void;

type TensorLike = {
  tolist?: () => unknown;
  data?: Iterable<number>;
  dims?: number[];
};

type FeatureExtractor = (
  input: string[] | string,
  options: Record<string, unknown>,
) => Promise<TensorLike | number[][]>;

function hashToken(token: string) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function hashEmbeddings(texts: string[]) {
  return texts.map((text) => {
    const vector = Array.from({ length: HASH_DIMENSIONS }, () => 0);
    for (const token of tokenize(text)) {
      const hash = hashToken(token);
      const index = hash % HASH_DIMENSIONS;
      const sign = hash % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }
    return normalizeVector(vector);
  });
}

function tensorToVectors(
  output: TensorLike | number[][],
  expectedCount: number,
) {
  if (Array.isArray(output)) {
    return output.map((vector) => normalizeVector(vector.map(Number)));
  }

  const listed = output.tolist?.();
  if (Array.isArray(listed)) {
    const first = listed[0];
    if (Array.isArray(first) && Array.isArray(first[0])) {
      return (listed as number[][][]).map((item) =>
        normalizeVector(item[0].map(Number)),
      );
    }
    if (Array.isArray(first)) {
      return (listed as number[][]).map((item) =>
        normalizeVector(item.map(Number)),
      );
    }
  }

  if (output.data && output.dims && output.dims.length >= 2) {
    const data = [...output.data].map(Number);
    const dimensions = output.dims.at(-1) ?? HASH_DIMENSIONS;
    const vectors: number[][] = [];
    for (let offset = 0; offset < data.length; offset += dimensions) {
      vectors.push(normalizeVector(data.slice(offset, offset + dimensions)));
    }
    return vectors.slice(0, expectedCount);
  }

  throw new Error("Embedding model returned an unsupported tensor shape");
}

export async function embedTexts(
  texts: string[],
  mode: "fast" | "semantic",
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
): Promise<EmbeddingResult> {
  if (signal?.aborted) {
    throw new Error("Build cancelled before embeddings started.");
  }

  if (mode === "fast") {
    onProgress?.({
      completed: texts.length,
      total: texts.length,
      detail: "Using fast local hash embeddings",
    });
    return { vectors: hashEmbeddings(texts), provider: "hash-local" };
  }

  try {
    onProgress?.({
      completed: 0,
      total: texts.length,
      detail: "Loading sentence-transformers model",
    });
    const module = (await import("@huggingface/transformers")) as unknown as {
      pipeline: (
        task: "feature-extraction",
        model: string,
        options?: Record<string, unknown>,
      ) => Promise<FeatureExtractor>;
      env?: { allowLocalModels?: boolean; allowRemoteModels?: boolean };
    };

    if (module.env) {
      module.env.allowLocalModels = false;
      module.env.allowRemoteModels = true;
    }

    const extractor = await module.pipeline(
      "feature-extraction",
      EMBEDDING_MODEL,
      {
        dtype: "q8",
        device: "wasm",
      },
    );

    const vectors: number[][] = [];
    const batchSize = 8;
    for (let offset = 0; offset < texts.length; offset += batchSize) {
      if (signal?.aborted) {
        throw new Error("Build cancelled while embedding articles.");
      }
      const batch = texts.slice(offset, offset + batchSize);
      const output = await extractor(batch, {
        pooling: "mean",
        normalize: true,
      });
      vectors.push(...tensorToVectors(output, batch.length));
      onProgress?.({
        completed: Math.min(offset + batch.length, texts.length),
        total: texts.length,
        detail: "Embedding articles with sentence-transformers",
      });
    }

    return { vectors, provider: "sentence-transformers" };
  } catch {
    onProgress?.({
      completed: texts.length,
      total: texts.length,
      detail: "Semantic model unavailable; using local fallback embeddings",
    });
    return {
      vectors: hashEmbeddings(texts),
      provider: "sentence-transformers-fallback",
    };
  }
}
