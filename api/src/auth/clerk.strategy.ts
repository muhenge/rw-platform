import { User, verifyToken } from '@clerk/backend';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ClerkClient } from '@clerk/backend';
import { Request } from 'express';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async validate(req: Request): Promise<User> {
    // Try to get token from Authorization header first
    let token = req.headers.authorization?.split(' ').pop();

    // If no token in header, try to get it from cookies
    if (!token && req.cookies?.__session) {
      token = req.cookies.__session;
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      // Verify the token with Clerk
      const tokenPayload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });

      // Get the full user object from Clerk
      const user = await this.clerkClient.users.getUser(tokenPayload.sub);

      // Attach the raw token to the request for later use if needed
      (req as any).token = token;

      return user;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
