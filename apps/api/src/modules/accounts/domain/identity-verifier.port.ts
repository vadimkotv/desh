export const IDENTITY_VERIFIER = Symbol('IDENTITY_VERIFIER');

// Who the caller actually is, as far as we can prove it.
export interface VerifiedIdentity {
  privyDid: string;
  walletAddress?: string;
  email?: string;
  // False when no Privy app is configured and we took the client's word for it. The
  // flag is stored and surfaced, so a demo session is never mistaken for a real one.
  verified: boolean;
}

export interface IdentityClaims {
  accessToken?: string;
  privyDid?: string;
  walletAddress?: string;
  email?: string;
}

export interface IdentityVerifier {
  readonly enabled: boolean;
  verify(claims: IdentityClaims): Promise<VerifiedIdentity>;
}
