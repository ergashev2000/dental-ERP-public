import type { ID } from '@/shared/types/common';
import type { Role } from '@/shared/constants/roles';

export type { Role };

export interface User {
  id: ID;
  username: string;
  role: Role;
  staffId: ID;
  isActive: boolean;
}

/** Mock'da parol faqat seed ichida saqlanadi */
export interface UserRecord extends User {
  password: string;
}

export interface Session {
  token: string;
  user: User;
  staffName: string;
}

export interface LoginPayload {
  login: string;
  password: string;
  remember: boolean;
}
