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
      console.log('Validating Oura token...');
      // Try a simple API call to validate the token
      // Use a date range that's more likely to have data
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      console.log('Trying sleep data for date range:', startDate, 'to', endDate);

      await this.getSleep({ start_date: startDate, end_date: endDate });
      console.log('Sleep data validation successful');
      return true;
    } catch (error) {
      console.log('Sleep data validation failed:', error);
      if (error instanceof OuraAPIError) {
        console.log('OuraAPIError status:', error.statusCode);
        if (error.statusCode === 401) {
          console.log('401 error - token invalid');
          return false;
        }
        // If it's a 404 or other error, the token might still be valid
        // Let's try a different endpoint
        try {
          console.log('Trying readiness data as fallback...');
          await this.getReadiness({ start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] });
          console.log('Readiness data validation successful');
          return true;
        } catch (secondError) {
          console.log('Readiness data validation failed:', secondError);
          if (secondError instanceof OuraAPIError && secondError.statusCode === 401) {
            console.log('401 error on readiness - token invalid');
            return false;
          }
          // If we get here, the token might be valid but there's no data
          // Let's assume it's valid if we don't get a 401
          console.log('Assuming token is valid (no 401 error)');
          return true;
        }
      }
      // For any other error, assume the token is valid
      console.log('Non-OuraAPIError, assuming token is valid');
      return true;
    }
  }
} 