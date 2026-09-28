import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Profile } from '../domain/types';

interface Session {
  profile: Profile | null;
  /** 앱 시작 시 저장된 세션을 확인하는 중 */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    api
      .getSession()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setRestoring(false));
  }, []);

  const value: Session = {
    profile,
    restoring,
    async signIn(email, password) {
      client.clear(); // 이전 사용자의 캐시가 보이지 않게 한다
      setProfile(await api.signIn(email, password));
    },
    async signUp(email, password, displayName) {
      client.clear();
      setProfile(await api.signUp(email, password, displayName));
    },
    async signOut() {
      await api.signOut();
      client.clear();
      setProfile(null);
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있다');
  return session;
}
