import { Body, Controller, Post, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const { user, access_token } =
      await this.authService.register(createUserDto);

    return {
      message: 'User registered successfully',
      user,
      access_token, // Token returned so client can store it immediately
    };
  }

  /** Login and return JWT */
  @Public()
  @Post('signin')
  async login(@Body() loginDto: LoginDto) {
    const { user, access_token } = await this.authService.login(loginDto);

    return {
      message: 'Login successful',
      user,
      access_token,
    };
  }

  /** "Logout" just a client-side operation now */
  @Public()
  @Delete('signout')
  signout() {
    // No server-side state to clear when using token in client storage
    return {
      message: 'Logged out successfully — please clear token on client',
    };
  }
}
