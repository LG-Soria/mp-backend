// src/services/auth.service.ts

export interface MpAuthData {
  token: string | null;
  userId: string | null;
}

export const mpAuth: MpAuthData = {
  token: null,
  userId: null,
};
