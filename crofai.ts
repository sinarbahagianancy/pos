import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface CrofModel {
  id: string;
  name: string;
  context_length: number;
  max_completion_tokens: number;
  reasoning_effort?: boolean;
  custom_reasoning?: boolean;
  pricing: {
    prompt: string;
    completion: string;
    cache_prompt?: string;
  };
}

export default async function (pi: ExtensionAPI) {
  const apiKeyVar = "CROFAI_API_KEY";
  const baseUrl = "https://crof.ai/v1";

  // Fetch models from CrofAI
  const res = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${process.env[apiKeyVar] ?? ""}`,
    },
  });

  let models: CrofModel[] = [];
  if (res.ok) {
    const payload = (await res.json()) as { data: CrofModel[] };
    models = payload.data;
  } else {
    // Fallback: register with known models from docs if API fails
    console.warn("CrofAI: Could not fetch models from API, using fallback list");
  }

  if (models.length === 0) {
    // No models fetched — don't register anything
    return;
  }

  pi.registerProvider("crofai", {
    name: "CrofAI",
    baseUrl,
    apiKey: apiKeyVar,
    api: "openai-completions",
    models: models.map((m) => {
      const supportsReasoning = m.reasoning_effort === true || m.custom_reasoning === true;

      return {
        id: m.id,
        name: m.name,
        reasoning: supportsReasoning,
        input: ["text", "image"],
        cost: {
          input: parseFloat(m.pricing.prompt),
          output: parseFloat(m.pricing.completion),
          cacheRead: m.pricing.cache_prompt ? parseFloat(m.pricing.cache_prompt) : 0,
          cacheWrite: 0,
        },
        contextWindow: m.context_length,
        maxTokens: m.max_completion_tokens,
        ...(supportsReasoning && {
          compat: {
            supportsReasoningEffort: true,
            supportsDeveloperRole: true,
          },
          thinkingLevelMap: {
            off: "none",
            minimal: "low",
            low: "low",
            medium: "medium",
            high: "high",
            xhigh: "high",
          },
        }),
      };
    }),
  });
}
