import type { UserProfile, UserSettings, AuthState } from '../types/whoop';
import { storageService } from './StorageService';

interface StoredAuthAccount {
  profile: UserProfile;
  passwordHash: string;
  salt: string;
}

const AUTH_DB_NAME = 'whoop_auth_db';
const AUTH_STORE_NAME = 'accounts';
const ACTIVE_USER_KEY = 'whoop_active_user_id';
const PROFILES_INDEX_KEY = 'whoop_cached_profiles';

const DEFAULT_USER_SETTINGS: UserSettings = {
  name: '',
  age: 28,
  weightKg: 75,
  heightCm: 178,
  maxHr: 192,
  restingHrBaseline: 56,
  hrvBaseline: 62,
  sleepNeedHours: 7.8,
  gender: 'male',
  language: 'ar',
  profileConfirmed: true,
};

const AVATAR_COLORS = [
  '#0093E9',
  '#16EC06',
  '#FF8A00',
  '#9B51E0',
  '#00F0FF',
  '#FF3344',
  '#FFDE00',
  '#E040FB',
];

/**
 * High-performance SHA-256 cryptographic password hasher
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export class AuthService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private currentUser: UserProfile | null = null;
  private profilesCache: UserProfile[] = [];
  private subscribers = new Set<(state: AuthState) => void>();
  private isInitialized = false;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }
      const req = indexedDB.open(AUTH_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(AUTH_STORE_NAME)) {
          const store = db.createObjectStore(AUTH_STORE_NAME, { keyPath: 'profile.id' });
          store.createIndex('email', 'profile.email', { unique: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  public async init(): Promise<AuthState> {
    if (this.isInitialized) return this.getState();

    try {
      await this.initDatabase();
      const accounts = await this.getAllStoredAccounts();
      this.profilesCache = accounts.map((a) => a.profile);

      // Check active user id from persistent storage
      const activeId = localStorage.getItem(ACTIVE_USER_KEY);
      if (activeId) {
        const found = this.profilesCache.find((p) => p.id === activeId);
        if (found) {
          this.currentUser = found;
          // Set active user in StorageService to enforce multi-tenant isolation
          storageService.setUserId(found.id);
        }
      }

      this.isInitialized = true;
      this.notifySubscribers();
    } catch (err) {
      console.warn('[AuthService] Initialization warning:', err);
      this.isInitialized = true;
    }

    return this.getState();
  }

  public getState(): AuthState {
    return {
      currentUser: this.currentUser,
      profiles: this.profilesCache,
      isAuthenticated: this.currentUser !== null,
      isLoading: !this.isInitialized,
    };
  }

  public subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch {}
    });
  }

  private async getAllStoredAccounts(): Promise<StoredAuthAccount[]> {
    const db = await this.initDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUTH_STORE_NAME, 'readonly');
      const store = tx.objectStore(AUTH_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredAuthAccount[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async saveStoredAccount(account: StoredAuthAccount): Promise<void> {
    const db = await this.initDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUTH_STORE_NAME, 'readwrite');
      const store = tx.objectStore(AUTH_STORE_NAME);
      const req = store.put(account);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Register a new user profile with cryptographic password hash
   */
  public async signUp(params: {
    email: string;
    password: string;
    fullName: string;
    settings?: Partial<UserSettings>;
    pairedDeviceId?: string | null;
    pairedDeviceName?: string | null;
  }): Promise<UserProfile> {
    await this.init();

    const normalizedEmail = params.email.trim().toLowerCase();
    const existing = this.profilesCache.find((p) => p.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('A WHOOP profile with this email already exists.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const salt = generateSalt();
    const passwordHash = await hashPassword(params.password, salt);

    const colorIndex = this.profilesCache.length % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];

    const mergedSettings: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      name: params.fullName.trim() || normalizedEmail.split('@')[0],
      ...(params.settings || {}),
    };

    const newProfile: UserProfile = {
      id: userId,
      email: normalizedEmail,
      fullName: params.fullName.trim() || normalizedEmail.split('@')[0],
      avatarColor,
      pairedDeviceId: params.pairedDeviceId || null,
      pairedDeviceName: params.pairedDeviceName || null,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      settings: mergedSettings,
    };

    const storedAccount: StoredAuthAccount = {
      profile: newProfile,
      passwordHash,
      salt,
    };

    await this.saveStoredAccount(storedAccount);

    // Update active cache and switch isolated storage context
    this.profilesCache.push(newProfile);
    this.currentUser = newProfile;
    localStorage.setItem(ACTIVE_USER_KEY, userId);

    // Apply strict multi-tenant isolation
    storageService.setUserId(userId);
    storageService.saveUserSettings(mergedSettings);

    this.notifySubscribers();
    return newProfile;
  }

  /**
   * Sign in with email and password
   */
  public async login(email: string, password: string): Promise<UserProfile> {
    await this.init();

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = await this.getAllStoredAccounts();
    const account = accounts.find((a) => a.profile.email.toLowerCase() === normalizedEmail);

    if (!account) {
      throw new Error('No account found with this email. Please check your email or create an account.');
    }

    const computedHash = await hashPassword(password, account.salt);
    if (computedHash !== account.passwordHash) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    // Update login timestamp
    account.profile.lastLoginAt = Date.now();
    await this.saveStoredAccount(account);

    this.currentUser = account.profile;
    localStorage.setItem(ACTIVE_USER_KEY, account.profile.id);

    // Apply strict multi-tenant isolation
    storageService.setUserId(account.profile.id);

    this.notifySubscribers();
    return account.profile;
  }

  /**
   * Quick-switch between existing user profiles (up to 5+ friends)
   */
  public async switchUser(userId: string): Promise<UserProfile> {
    await this.init();

    const target = this.profilesCache.find((p) => p.id === userId);
    if (!target) {
      throw new Error('Selected profile does not exist.');
    }

    this.currentUser = target;
    localStorage.setItem(ACTIVE_USER_KEY, target.id);

    // Partition all storage keys to target user immediately
    storageService.setUserId(target.id);

    this.notifySubscribers();
    return target;
  }

  /**
   * Logout current user and clear in-memory sensitive telemetry
   */
  public async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem(ACTIVE_USER_KEY);
    storageService.setUserId(null);
    this.notifySubscribers();
  }

  /**
   * Update current user's profile or baseline settings
   */
  public async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const accounts = await this.getAllStoredAccounts();
    const account = accounts.find((a) => a.profile.id === userId);
    if (!account) throw new Error('Account not found');

    account.profile = {
      ...account.profile,
      ...updates,
      settings: updates.settings ? { ...account.profile.settings, ...updates.settings } : account.profile.settings,
    };

    await this.saveStoredAccount(account);

    const cacheIndex = this.profilesCache.findIndex((p) => p.id === userId);
    if (cacheIndex !== -1) {
      this.profilesCache[cacheIndex] = account.profile;
    }

    if (this.currentUser?.id === userId) {
      this.currentUser = account.profile;
      if (account.profile.settings) {
        storageService.saveUserSettings(account.profile.settings);
      }
    }

    this.notifySubscribers();
    return account.profile;
  }

  /**
   * Update paired BLE device for current user
   */
  public async updatePairedDevice(
    userId: string,
    deviceId: string | null,
    deviceName?: string
  ): Promise<void> {
    await this.updateProfile(userId, {
      pairedDeviceId: deviceId,
      pairedDeviceName: deviceName || null,
    });
    if (deviceId) {
      localStorage.setItem(`user_${userId}_ble_device`, JSON.stringify({ id: deviceId, name: deviceName }));
    } else {
      localStorage.removeItem(`user_${userId}_ble_device`);
    }
  }

  public async isEmailRegistered(email: string): Promise<boolean> {
    await this.init();
    const normalized = email.trim().toLowerCase();
    return this.profilesCache.some((p) => p.email.toLowerCase() === normalized);
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getAllProfiles(): UserProfile[] {
    return this.profilesCache;
  }
}

export const authService = new AuthService();
