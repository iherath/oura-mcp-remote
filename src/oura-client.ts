// Using built-in fetch (Node.js 18+)

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  next_token?: string;
}

export interface OuraSleepData {
  sleep: Array<{
    id: string;
    contributors: {
      deep_sleep: number;
      efficiency: number;
      latency: number;
      rem_sleep: number;
      restfulness: number;
      timing: number;
      total_sleep: number;
    };
    day: string;
    score: number;
    timestamp: string;
  }>;
  next_token?: string;
}

export interface OuraReadinessData {
  readiness: Array<{
    id: string;
    contributors: {
      activity_balance: number;
      body_temperature: number;
      hrv_balance: number;
      previous_day_activity: number;
      previous_night: number;
      recovery_index: number;
      resting_heart_rate: number;
      sleep_balance: number;
    };
    day: string;
    score: number;
    temperature_deviation: number;
    timestamp: string;
  }>;
  next_token?: string;
}

export interface OuraResilienceData {
  resilience: Array<{
    id: string;
    contributors: {
      activity_balance: number;
      body_temperature: number;
      hrv_balance: number;
      previous_day_activity: number;
      previous_night: number;
      recovery_index: number;
      resting_heart_rate: number;
      sleep_balance: number;
    };
    day: string;
    score: number;
    temperature_deviation: number;
    timestamp: string;
  }>;
  next_token?: string;
}

export class OuraAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OuraAPIError';
  }
}

export class OuraClient {
  private baseUrl = 'https://api.oura.com/v2/usercollection';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async makeRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new OuraAPIError(
        `Oura API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        response.status
      );
    }

    return response.json();
  }

  async getSleep(params?: DateRangeParams): Promise<OuraSleepData> {
    const requestParams: Record<string, string> = {};
    if (params?.start_date) requestParams.start_date = params.start_date;
    if (params?.end_date) requestParams.end_date = params.end_date;
    if (params?.next_token) requestParams.next_token = params.next_token;

    return this.makeRequest('/daily_sleep', requestParams);
  }

  async getReadiness(params?: DateRangeParams): Promise<OuraReadinessData> {
    const requestParams: Record<string, string> = {};
    if (params?.start_date) requestParams.start_date = params.start_date;
    if (params?.end_date) requestParams.end_date = params.end_date;
    if (params?.next_token) requestParams.next_token = params.next_token;

    return this.makeRequest('/daily_readiness', requestParams);
  }

  async getResilience(params?: DateRangeParams): Promise<OuraResilienceData> {
    const requestParams: Record<string, string> = {};
    if (params?.start_date) requestParams.start_date = params.start_date;
    if (params?.end_date) requestParams.end_date = params.end_date;
    if (params?.next_token) requestParams.next_token = params.next_token;

    return this.makeRequest('/daily_resilience', requestParams);
  }

  async getTodaySleep(): Promise<OuraSleepData> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSleep({ start_date: today, end_date: today });
  }

  async getTodayReadiness(): Promise<OuraReadinessData> {
    const today = new Date().toISOString().split('T')[0];
    return this.getReadiness({ start_date: today, end_date: today });
  }

  async getTodayResilience(): Promise<OuraResilienceData> {
    const today = new Date().toISOString().split('T')[0];
    return this.getResilience({ start_date: today, end_date: today });
  }

  // Validate token by making a test request
  async validateToken(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.getSleep({ start_date: today, end_date: today });
      return true;
    } catch (error) {
      if (error instanceof OuraAPIError && error.statusCode === 401) {
        return false;
      }
      throw error;
    }
  }
} 