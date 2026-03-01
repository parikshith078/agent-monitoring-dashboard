export interface RedisApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  error: unknown | null;
}

export interface ActiveChatsPayload {
  keys: string[];
  count: number;
}

export interface AvailableChat {
  key: string;
  chatId: string;
}

export class RedisApi {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://100.65.209.109:7018") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async fetchAvailableChats(signal?: AbortSignal): Promise<AvailableChat[]> {
    const url = `${this.baseUrl}/json/?pattern=execution_state%3A%2A`;
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chats (status ${response.status})`);
    }

    const body = (await response.json()) as RedisApiResponse<ActiveChatsPayload>;

    if (!body.success || !body.data || !Array.isArray(body.data.keys)) {
      throw new Error("Unexpected response while fetching chats");
    }

    return body.data.keys.map((key) => ({
      key,
      chatId: key.replace(/^execution_state:/, ""),
    }));
  }
}

export const redisApi = new RedisApi();
