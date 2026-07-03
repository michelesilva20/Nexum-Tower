function resolveApiBase(): string {
  // Browser: same-origin proxy so httpOnly cookies work (avoids cross-port 3000→3333 issues)
  if (typeof window !== "undefined") {
    return "/api";
  }

  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3333"
  );
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${resolveApiBase()}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = "Erro na requisição.";
    try {
      const body = (await response.json()) as {
        message?: string | string[];
        error?: { message?: string | string[] };
      };
      // Envelope padronizado da API: { success: false, error: { message } }
      const standardized = body.error?.message;
      if (typeof standardized === "string") message = standardized;
      else if (Array.isArray(standardized)) message = standardized.join(", ");
      // Fallback para respostas não padronizadas do Nest
      else if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as unknown;

  // Envelope padronizado da API: { success: true, data, meta }.
  // Desembrulha `data` de forma transparente; mantém compatibilidade
  // com respostas ainda não padronizadas.
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export { resolveApiBase as getApiBaseUrl };
