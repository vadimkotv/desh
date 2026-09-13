import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { AppConfig } from '../../../config/app-config';
import type { IdentityClaims, IdentityVerifier, VerifiedIdentity } from '../domain/identity-verifier.port';

const ISSUER = 'privy.io';
const jwksUrl = (appId: string) => new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`);

// Privy access tokens are ES256 JWTs issued by `privy.io` and audienced to the app id;
// `sub` is the user's DID. Verification uses the app's public JWKS, or the single
// verification key from the dashboard when one is pasted into the env.
@Injectable()
export class PrivyVerifier implements IdentityVerifier {
  private readonly log = new Logger(PrivyVerifier.name);
  private readonly appId: string | undefined;
  private readonly keys: ReturnType<typeof createRemoteJWKSet> | ReturnType<typeof createLocalJWKSet> | null = null;

  constructor(config: AppConfig) {
    const { PRIVY_APP_ID, PRIVY_JWKS_JSON } = config.env;
    this.appId = PRIVY_APP_ID;
    if (!PRIVY_APP_ID) {
      this.log.log('PRIVY_APP_ID not set: sessions run in demo mode and are marked unverified');
      return;
    }
    this.keys = PRIVY_JWKS_JSON
      ? createLocalJWKSet(JSON.parse(PRIVY_JWKS_JSON))
      : createRemoteJWKSet(jwksUrl(PRIVY_APP_ID));
    this.log.log(`Privy verification active for app ${PRIVY_APP_ID}`);
  }

  get enabled(): boolean {
    return this.keys !== null;
  }

  async verify(claims: IdentityClaims): Promise<VerifiedIdentity> {
    if (!this.keys || !this.appId) return this.demo(claims);
    if (!claims.accessToken) throw new UnauthorizedException('Privy access token is required');

    try {
      const { payload } = await jwtVerify(claims.accessToken, this.keys, {
        issuer: ISSUER,
        audience: this.appId,
      });
      return { privyDid: this.subjectOf(payload), walletAddress: claims.walletAddress, email: claims.email, verified: true };
    } catch (error) {
      this.log.warn(`rejected Privy token: ${(error as Error).message}`);
      throw new UnauthorizedException('invalid Privy access token');
    }
  }

  private subjectOf(payload: JWTPayload): string {
    if (!payload.sub) throw new UnauthorizedException('Privy token has no subject');
    return payload.sub;
  }

  // No Privy app configured: the whole flow still has to run offline, so the client's
  // claimed identity is accepted and stamped `verified: false` everywhere it appears.
  private demo(claims: IdentityClaims): VerifiedIdentity {
    const privyDid = claims.privyDid ?? (claims.walletAddress ? `demo:${claims.walletAddress.toLowerCase()}` : undefined);
    if (!privyDid) throw new UnauthorizedException('a wallet address or privyDid is required in demo mode');
    return { privyDid, walletAddress: claims.walletAddress, email: claims.email, verified: false };
  }
}
