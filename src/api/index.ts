import { createDemoApi, createDemoStore } from './demoApi';
import { createSupabaseApi } from './supabaseApi';
import type { Api } from './types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const apiMode: 'supabase' | 'demo' = url && anonKey ? 'supabase' : 'demo';

export const api: Api =
  url && anonKey ? createSupabaseApi(url, anonKey) : createDemoApi(createDemoStore(), { latencyMs: 400 });

export type { Api } from './types';
