import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionRequest, SessionRequestSchema, type SetRole, SetRoleSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { SessionUseCase } from '../application/session.usecase';
import { IDENTITY_VERIFIER, type IdentityVerifier } from '../domain/identity-verifier.port';

@ApiTags('accounts')
@Controller('auth')
export class AccountsController {
  constructor(
    private readonly sessions: SessionUseCase,
    @Inject(IDENTITY_VERIFIER) private readonly identity: IdentityVerifier,
  ) {}

  @Get('mode')
  @ApiOperation({ summary: 'Whether Privy verification is active, so the UI can say so honestly' })
  mode() {
    return { privy: this.identity.enabled };
  }

  @Post('session')
  @ApiOperation({ summary: 'Sign in: verify the Privy token (or accept a demo identity) and return the session' })
  open(@Body(new ZodValidationPipe(SessionRequestSchema)) body: SessionRequest) {
    return this.sessions.open(body);
  }

  @Get('accounts/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.sessionOf(id);
  }

  @Post('accounts/:id/role')
  @ApiOperation({ summary: 'Founder or investor — the one choice onboarding asks for' })
  setRole(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(SetRoleSchema)) body: SetRole) {
    return this.sessions.setRole(id, body.role);
  }
}
