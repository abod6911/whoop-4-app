import type {
  WhoopSleepRecord,
  WhoopSleepResponse,
  ProcessedWhoopSleep,
  FormattedTimeDuration,
  WhoopOAuthConfig,
  WhoopTokenResponse,
  WhoopSleepScoreState,
} from '../types/whoop';

// --- Official WHOOP API Endpoints (v1) ---
export const WHOOP_API_BASE_URL = 'https://api.prod.whoop.com/developer/v1';
export const WHOOP_OAUTH_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
export const WHOOP_OAUTH_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

// --- Mandatory Scopes per WHOOP Developer Documentation ---
// Requirement 1: read:sleep is explicitly required, along with offline for auto-refresh
export const DEFAULT_REQUIRED_SCOPES = [
  'read:sleep',
  'offline',
  'read:profile',
  'read:recovery',
  'read:cycles',
  'read:workout',
];

const WHOOP_ACCESS_TOKEN_KEY = 'whoop_cloud_access_token';
const WHOOP_REFRESH_TOKEN_KEY = 'whoop_cloud_refresh_token';
const WHOOP_TOKEN_EXPIRY_KEY = 'whoop_cloud_token_expiry';
const WHOOP_OAUTH_CONFIG_KEY = 'whoop_oauth_config';

/**
 * Converts a millisecond duration into hours and minutes
 * e.g. 27360000ms -> { hours: 7, minutes: 36, totalHoursDecimal: 7.6, formatted: "7h 36m", formattedAr: "7 س 36 د" }
 */
export function millisecondsToHoursAndMinutes(milli?: number | null): FormattedTimeDuration {
  if (milli === null || milli === undefined || isNaN(milli) || milli < 0) {
    return {
      hours: 0,
      minutes: 0,
      totalHoursDecimal: 0,
      formatted: '--',
      formattedAr: '--',
    };
  }

  const totalMinutes = Math.round(milli / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalHoursDecimal = Number((totalMinutes / 60).toFixed(2));

  return {
    hours,
    minutes,
    totalHoursDecimal,
    formatted: `${hours}h ${minutes}m`,
    formattedAr: `${hours} س ${minutes} د`,
  };
}

export class WhoopApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private oauthConfig: WhoopOAuthConfig | null = null;

  constructor() {
    this.loadPersistedTokens();
  }

  // =========================================================================
  // 1. صلاحيات الوصول (OAuth Scopes & Authentication)
  // =========================================================================

  /**
   * Builds the official WHOOP OAuth Authorization URL.
   * Ensures that `read:sleep` and `offline` scopes are strictly included.
   */
  public getAuthorizationUrl(options?: {
    clientId?: string;
    redirectUri?: string;
    additionalScopes?: string[];
    state?: string;
  }): string {
    const config = this.getOAuthConfig();
    const clientId = options?.clientId || config?.clientId || '';
    const redirectUri = options?.redirectUri || config?.redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/oauth/callback` : '');

    // Strictly ensure `read:sleep` and `offline` are included
    const mergedScopes = Array.from(
      new Set([
        'read:sleep',
        'offline',
        ...(options?.additionalScopes || config?.scopes || DEFAULT_REQUIRED_SCOPES),
      ])
    ).join(' ');

    const state = options?.state || `whoop_auth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('whoop_oauth_state', state);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: mergedScopes,
      state: state,
    });

    const fullUrl = `${WHOOP_OAUTH_AUTH_URL}?${params.toString()}`;
    console.log('[WHOOP OAuth] Generated Authorization URL:', fullUrl);
    console.log('[WHOOP OAuth] Active Scopes:', mergedScopes);
    return fullUrl;
  }

  /**
   * Exchanges authorization code for Access & Refresh tokens.
   */
  public async exchangeCodeForToken(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }): Promise<WhoopTokenResponse> {
    console.log('[WHOOP OAuth] Exchanging authorization code for token...');

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
    });

    const response = await fetch(WHOOP_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const statusCode = response.status;
    const rawData = await response.json();

    console.log('[WHOOP OAuth] Token Exchange Status Code:', statusCode);
    console.log('[WHOOP OAuth] Token Raw Response:', JSON.stringify(rawData, null, 2));

    if (!response.ok) {
      throw new Error(rawData.error_description || rawData.error || `Failed to exchange token (HTTP ${statusCode})`);
    }

    const tokenData = rawData as WhoopTokenResponse;
    this.setTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    return tokenData;
  }

  /**
   * Refreshes access token using the stored `offline` refresh token.
   */
  public async refreshAccessToken(params?: {
    clientId?: string;
    clientSecret?: string;
  }): Promise<string> {
    const refreshToken = this.refreshToken || this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available. User must authenticate via WHOOP OAuth with `offline` scope.');
    }

    const config = this.getOAuthConfig();
    const clientId = params?.clientId || config?.clientId;
    const clientSecret = params?.clientSecret || config?.clientSecret;

    if (!clientId || !clientSecret) {
      throw new Error('Client credentials (clientId & clientSecret) required to refresh token.');
    }

    console.log('[WHOOP OAuth] Refreshing access token via offline grant...');

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'offline',
    });

    const response = await fetch(WHOOP_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const statusCode = response.status;
    const rawData = await response.json();

    console.log('[WHOOP OAuth] Token Refresh Status Code:', statusCode);
    console.log('[WHOOP OAuth] Token Refresh Raw Response:', JSON.stringify(rawData, null, 2));

    if (!response.ok) {
      throw new Error(rawData.error_description || rawData.error || `Failed to refresh token (HTTP ${statusCode})`);
    }

    const tokenData = rawData as WhoopTokenResponse;
    this.setTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresIn: tokenData.expires_in,
    });

    return tokenData.access_token;
  }

  // =========================================================================
  // 2. نقطة النهاية وجلب البيانات (Endpoint & Fetching)
  // 4. تتبع الأخطاء وسجلات Debugging Logs
  // =========================================================================

  /**
   * Fetches sleep activities from WHOOP API v1:
   * GET https://api.prod.whoop.com/developer/v1/activity/sleep
   *
   * Includes complete logging of:
   * - HTTP Status Code
   * - Raw JSON response from WHOOP API before processing
   */
  public async fetchSleepActivities(options?: {
    token?: string;
    limit?: number; // max 25
    start?: string; // ISO 8601
    end?: string;   // ISO 8601
    nextToken?: string;
    isRetry?: boolean;
  }): Promise<WhoopSleepResponse> {
    const token = options?.token || this.getAccessToken();
    if (!token) {
      throw new Error('WHOOP Access Token missing. Please connect WHOOP account or supply an access token.');
    }

    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    if (options?.limit) queryParams.set('limit', String(Math.min(25, Math.max(1, options.limit))));
    if (options?.start) queryParams.set('start', options.start);
    if (options?.end) queryParams.set('end', options.end);
    if (options?.nextToken) queryParams.set('nextToken', options.nextToken);

    const queryString = queryParams.toString();
    const endpoint = `${WHOOP_API_BASE_URL}/activity/sleep${queryString ? `?${queryString}` : ''}`;

    console.log(`[HEALTH-TECH DIAGNOSTIC: STEP 1 - INGESTION SOURCE] WHOOP Developer API v1 -> GET ${endpoint}`);
    console.log(`[WHOOP API] Authorization: Bearer ${token.substring(0, 8)}...${token.slice(-4)}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[HEALTH-TECH DIAGNOSTIC: STEP 2 - RAW PAYLOAD RECEIVED] HTTP Status Code: ${response.status} ${response.statusText}`);

    // Read full raw response as text first to safely inspect and log
    const responseText = await response.text();
    console.log('[HEALTH-TECH DIAGNOSTIC: STEP 2 - RAW PAYLOAD RECEIVED] Raw Response from WHOOP API:\n' + responseText);

    let rawJson: any = null;
    try {
      rawJson = JSON.parse(responseText);
      console.log('[HEALTH-TECH DIAGNOSTIC: STEP 2 - RAW PAYLOAD RECEIVED] Parsed JSON Object:', rawJson);
    } catch {
      rawJson = { message: responseText };
    }

    // Check for expired token (HTTP 401) and attempt auto-refresh via offline scope
    if (response.status === 401 && this.getRefreshToken() && !options?.isRetry) {
      console.warn('[HEALTH-TECH DIAGNOSTIC: STEP 2] 401 Unauthorized encountered. Attempting auto-refresh via offline grant...');
      try {
        const refreshedToken = await this.refreshAccessToken();
        console.log('[HEALTH-TECH DIAGNOSTIC: STEP 2] Token auto-refresh successful. Retrying sleep fetch...');
        return await this.fetchSleepActivities({ ...options, token: refreshedToken, isRetry: true });
      } catch (refreshErr) {
        console.error('[HEALTH-TECH DIAGNOSTIC: STEP 2] Automatic token refresh failed:', refreshErr);
      }
    }

    if (!response.ok) {
      console.error(`[WHOOP API] Request failed with Status ${response.status}:`, rawJson);
      let errMsg = typeof rawJson === 'object' && rawJson !== null
        ? (rawJson.message || rawJson.error_description || rawJson.error || responseText)
        : responseText;

      if (response.status === 403) {
        errMsg = `Insufficient permission scopes (HTTP 403). Ensure 'read:sleep' is authorized in WHOOP developer portal. (${errMsg})`;
      } else if (response.status === 401) {
        errMsg = `Unauthorized (HTTP 401). Access token is expired or invalid. (${errMsg})`;
      }

      throw new Error(`WHOOP API Error (HTTP ${response.status}): ${errMsg}`);
    }

    // Requirement 3: Read from response.data.records or rawJson.records
    const records: WhoopSleepRecord[] = Array.isArray(rawJson.records)
      ? rawJson.records
      : (Array.isArray(rawJson?.data?.records) ? rawJson.data.records : []);

    return {
      records,
      next_token: rawJson.next_token || rawJson?.data?.next_token || null,
    };
  }

  // =========================================================================
  // 3. معالجة هيكل البيانات (JSON Response & Pagination & Score State)
  // =========================================================================

  /**
   * Processes a raw WHOOP Sleep Record according to Point 3:
   * - Extracts score.stage_summary when score_state === 'SCORED'
   * - Converts milliseconds to hours and minutes
   * - Gracefully handles 'PENDING_SCORE' and 'UNSCORABLE' without crashing
   * - Identifies naps
   */
  public processSleepRecord(record: WhoopSleepRecord): ProcessedWhoopSleep {
    const durationMs = record.start && record.end ? (new Date(record.end).getTime() - new Date(record.start).getTime()) : 0;
    // Any continuous rest session >= 4 hours MUST be treated as Primary Sleep, not a fragmented nap
    const isNap = Boolean(record.nap) && durationMs < 4 * 3600 * 1000;
    const scoreState: WhoopSleepScoreState = record.score_state || 'UNSCORABLE';

    // Handle PENDING_SCORE / UNSCORABLE states gracefully
    if (scoreState === 'PENDING_SCORE') {
      console.log(`[WHOOP API] Record #${record.id} is in PENDING_SCORE state: analyzing sleep data...`);
      return {
        id: record.id,
        isNap,
        scoreState: 'PENDING_SCORE',
        statusMessage: 'جاري تحليل بيانات النوم', // Arabic status requested by user
        startTime: record.start,
        endTime: record.end,
        totalInBedMilli: 0,
        totalAsleepMilli: 0,
        totalLightMilli: 0,
        totalSlowWaveMilli: 0,
        totalRemMilli: 0,
        totalAwakeMilli: 0,
        inBed: millisecondsToHoursAndMinutes(null),
        asleep: millisecondsToHoursAndMinutes(null),
        light: millisecondsToHoursAndMinutes(null),
        slowWave: millisecondsToHoursAndMinutes(null),
        rem: millisecondsToHoursAndMinutes(null),
        awake: millisecondsToHoursAndMinutes(null),
        performancePercentage: null,
        efficiencyPercentage: null,
        consistencyPercentage: null,
        respiratoryRate: null,
        stages: {
          awakePercent: 0,
          lightPercent: 0,
          deepPercent: 0,
          remPercent: 0,
        },
        sleepNeed: millisecondsToHoursAndMinutes(null),
        sleepDebt: millisecondsToHoursAndMinutes(null),
      };
    }

    if (scoreState === 'UNSCORABLE' || !record.score) {
      console.log(`[WHOOP API] Record #${record.id} is UNSCORABLE or missing score object.`);
      return {
        id: record.id,
        isNap,
        scoreState: 'UNSCORABLE',
        statusMessage: 'بيانات النوم غير قابلة للتقييم',
        startTime: record.start,
        endTime: record.end,
        totalInBedMilli: 0,
        totalAsleepMilli: 0,
        totalLightMilli: 0,
        totalSlowWaveMilli: 0,
        totalRemMilli: 0,
        totalAwakeMilli: 0,
        inBed: millisecondsToHoursAndMinutes(null),
        asleep: millisecondsToHoursAndMinutes(null),
        light: millisecondsToHoursAndMinutes(null),
        slowWave: millisecondsToHoursAndMinutes(null),
        rem: millisecondsToHoursAndMinutes(null),
        awake: millisecondsToHoursAndMinutes(null),
        performancePercentage: null,
        efficiencyPercentage: null,
        consistencyPercentage: null,
        respiratoryRate: null,
        stages: {
          awakePercent: 0,
          lightPercent: 0,
          deepPercent: 0,
          remPercent: 0,
        },
        sleepNeed: millisecondsToHoursAndMinutes(null),
        sleepDebt: millisecondsToHoursAndMinutes(null),
      };
    }

    // score_state is 'SCORED' -> Read details from score.stage_summary
    const stageSummary = record.score.stage_summary || {
      total_in_bed_time_milli: 0,
      total_awake_time_milli: 0,
      total_no_data_time_milli: 0,
      total_light_sleep_time_milli: 0,
      total_slow_wave_sleep_time_milli: 0,
      total_rem_sleep_time_milli: 0,
    };

    const inBedMilli = stageSummary.total_in_bed_time_milli || 0;
    const lightMilli = stageSummary.total_light_sleep_time_milli || 0;
    const slowWaveMilli = stageSummary.total_slow_wave_sleep_time_milli || 0; // Deep sleep
    const remMilli = stageSummary.total_rem_sleep_time_milli || 0;
    const awakeMilli = stageSummary.total_awake_time_milli || 0;

    // Total actual sleep duration (Light + Slow Wave + REM)
    const asleepMilli = lightMilli + slowWaveMilli + remMilli;

    // Convert Milliseconds to Hours & Minutes
    const inBed = millisecondsToHoursAndMinutes(inBedMilli);
    const asleep = millisecondsToHoursAndMinutes(asleepMilli);
    const light = millisecondsToHoursAndMinutes(lightMilli);
    const slowWave = millisecondsToHoursAndMinutes(slowWaveMilli);
    const rem = millisecondsToHoursAndMinutes(remMilli);
    const awake = millisecondsToHoursAndMinutes(awakeMilli);

    // Calculate Stage Percentages
    const lightPercent = asleepMilli > 0 ? Math.round((lightMilli / asleepMilli) * 100) : 0;
    const deepPercent = asleepMilli > 0 ? Math.round((slowWaveMilli / asleepMilli) * 100) : 0;
    const remPercent = asleepMilli > 0 ? Math.round((remMilli / asleepMilli) * 100) : 0;
    const awakePercent = inBedMilli > 0 ? Math.round((awakeMilli / inBedMilli) * 100) : 0;

    // Sleep Need breakdown
    const sleepNeededObj = record.score.sleep_needed;
    const baselineNeedMilli = sleepNeededObj?.baseline_milli || 27360000; // ~7.6 hours
    const sleepDebtMilli = sleepNeededObj?.need_from_sleep_debt_milli || 0;
    const strainNeedMilli = sleepNeededObj?.need_from_recent_strain_milli || 0;
    const totalNeedMilli = baselineNeedMilli + sleepDebtMilli + strainNeedMilli;

    const sleepNeed = millisecondsToHoursAndMinutes(totalNeedMilli);
    const sleepDebt = millisecondsToHoursAndMinutes(sleepDebtMilli);

    return {
      id: record.id,
      isNap,
      scoreState: 'SCORED',
      startTime: record.start,
      endTime: record.end,
      totalInBedMilli: inBedMilli,
      totalAsleepMilli: asleepMilli,
      totalLightMilli: lightMilli,
      totalSlowWaveMilli: slowWaveMilli,
      totalRemMilli: remMilli,
      totalAwakeMilli: awakeMilli,
      inBed,
      asleep,
      light,
      slowWave,
      rem,
      awake,
      performancePercentage: record.score.sleep_performance_percentage ?? null,
      efficiencyPercentage: record.score.sleep_efficiency_percentage ?? null,
      consistencyPercentage: record.score.sleep_consistency_percentage ?? null,
      respiratoryRate: record.score.respiratory_rate ?? null,
      stages: {
        awakePercent,
        lightPercent,
        deepPercent,
        remPercent,
      },
      sleepNeed,
      sleepDebt,
    };
  }

  /**
   * Fetches the primary overnight sleep record (filtering out naps where `nap: false`).
   * Adheres to requirement 3: "استبعاد القيلولة إذا كنا نعرض النوم الأساسي فقط عبر فحص الحقل nap: false"
   */
  public async fetchPrimarySleep(token?: string): Promise<ProcessedWhoopSleep | null> {
    const response = await this.fetchSleepActivities({ token, limit: 10 });
    const records = response.records || [];

    if (records.length === 0) {
      console.log('[HEALTH-TECH DIAGNOSTIC: STEP 2 - RAW PAYLOAD] Zero sleep records returned from WHOOP API.');
      return null;
    }

    // Isolate primary sleep: include records where nap === false OR duration >= 4.0 hours (supports shift work)
    const primarySleepRecords = records.filter((rec) => {
      if (rec.nap === false) return true;
      const dur = rec.start && rec.end ? (new Date(rec.end).getTime() - new Date(rec.start).getTime()) : 0;
      return dur >= 4 * 3600 * 1000;
    });

    // Sort descending by start time to guarantee the latest overnight sleep session is selected
    primarySleepRecords.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    console.log(`[HEALTH-TECH DIAGNOSTIC: STEP 2 - RAW PAYLOAD] Found ${primarySleepRecords.length} primary sleep records (nap: false) out of ${records.length} total records.`);

    const targetRecord = primarySleepRecords[0] || records[0];
    if (!targetRecord) return null;

    const processed = this.processSleepRecord(targetRecord);
    console.log(`[HEALTH-TECH DIAGNOSTIC: STEP 3 - PARSING & STAGE ANALYSIS] ID: ${processed.id}, State: ${processed.scoreState}, Asleep: ${processed.asleep.formatted}, InBed: ${processed.inBed.formatted}, Perf: ${processed.performancePercentage}%, SWS: ${processed.slowWave.formatted}, REM: ${processed.rem.formatted}`);

    return processed;
  }

  // =========================================================================
  // Token & Configuration Persistence Helpers
  // =========================================================================

  public setTokens(tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }): void {
    this.accessToken = tokens.accessToken;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WHOOP_ACCESS_TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        this.refreshToken = tokens.refreshToken;
        localStorage.setItem(WHOOP_REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
      if (tokens.expiresIn) {
        const expiry = Date.now() + tokens.expiresIn * 1000;
        this.tokenExpiry = expiry;
        localStorage.setItem(WHOOP_TOKEN_EXPIRY_KEY, String(expiry));
      }
    }
  }

  public getAccessToken(): string | null {
    if (this.accessToken && this.accessToken.trim().length > 5) return this.accessToken.trim();
    if (typeof localStorage !== 'undefined') {
      const keys = [
        WHOOP_ACCESS_TOKEN_KEY,
        'whoop_access_token',
        'whoop_token',
        'whoop_api_token',
        'access_token',
        'whoop_cloud_token',
      ];
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val && typeof val === 'string' && val.trim().length > 5) {
          this.accessToken = val.trim();
          return this.accessToken;
        }
      }
    }
    return null;
  }

  public hasValidToken(): boolean {
    const token = this.getAccessToken();
    return Boolean(token && token.length > 10);
  }

  /**
   * Automatically parses window.location for OAuth code or access token
   */
  public checkAndHandleUrlAuth(): { code?: string; token?: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const token = url.searchParams.get('access_token') || url.searchParams.get('token');

      let hashToken: string | null = null;
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        hashToken = hashParams.get('access_token') || hashParams.get('token');
      }

      const activeToken = token || hashToken;
      if (activeToken) {
        console.log('[WHOOP API] Detected access token in URL! Saving to storage...');
        this.setTokens({ accessToken: activeToken.trim() });
        url.searchParams.delete('access_token');
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
        return { token: activeToken.trim() };
      }

      if (code) {
        console.log('[WHOOP API] Detected OAuth authorization code in URL:', code);
        return { code };
      }
    } catch (e) {
      console.warn('[WHOOP API] URL auth check notice:', e);
    }
    return null;
  }

  public getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    if (typeof localStorage !== 'undefined') {
      this.refreshToken = localStorage.getItem(WHOOP_REFRESH_TOKEN_KEY);
    }
    return this.refreshToken;
  }

  public isTokenExpired(): boolean {
    if (!this.tokenExpiry && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(WHOOP_TOKEN_EXPIRY_KEY);
      if (stored) this.tokenExpiry = Number(stored);
    }
    if (!this.tokenExpiry) return false;
    // Buffer by 60 seconds
    return Date.now() >= this.tokenExpiry - 60000;
  }

  public setOAuthConfig(config: WhoopOAuthConfig): void {
    this.oauthConfig = config;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WHOOP_OAUTH_CONFIG_KEY, JSON.stringify(config));
    }
  }

  public getOAuthConfig(): WhoopOAuthConfig | null {
    if (this.oauthConfig) return this.oauthConfig;
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(WHOOP_OAUTH_CONFIG_KEY);
      if (saved) {
        try {
          this.oauthConfig = JSON.parse(saved);
        } catch {}
      }
    }
    return this.oauthConfig;
  }

  public getDiagnosticTokenInfo(): {
    hasToken: boolean;
    tokenPreview: string | null;
    isExpired: boolean;
    ttlSeconds: number | null;
    scopes: string[];
    hasRefreshToken: boolean;
  } {
    const token = this.getAccessToken();
    const isExpired = this.isTokenExpired();
    let ttlSeconds: number | null = null;
    if (this.tokenExpiry) {
      ttlSeconds = Math.max(0, Math.floor((this.tokenExpiry - Date.now()) / 1000));
    }
    const cfg = this.getOAuthConfig();
    const scopes = cfg?.scopes || DEFAULT_REQUIRED_SCOPES;
    return {
      hasToken: Boolean(token),
      tokenPreview: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : null,
      isExpired,
      ttlSeconds,
      scopes,
      hasRefreshToken: Boolean(this.getRefreshToken()),
    };
  }

  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(WHOOP_ACCESS_TOKEN_KEY);
      localStorage.removeItem(WHOOP_REFRESH_TOKEN_KEY);
      localStorage.removeItem(WHOOP_TOKEN_EXPIRY_KEY);
    }
  }

  private loadPersistedTokens(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      this.accessToken = localStorage.getItem(WHOOP_ACCESS_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(WHOOP_REFRESH_TOKEN_KEY);
      const exp = localStorage.getItem(WHOOP_TOKEN_EXPIRY_KEY);
      if (exp) this.tokenExpiry = Number(exp);
      const cfg = localStorage.getItem(WHOOP_OAUTH_CONFIG_KEY);
      if (cfg) this.oauthConfig = JSON.parse(cfg);
    } catch {}
  }
}

export const whoopApiService = new WhoopApiService();
