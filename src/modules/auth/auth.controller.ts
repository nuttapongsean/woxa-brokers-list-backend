import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, type: AuthTokensDto })
  register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — invalidates the current session' })
  logout(@CurrentUser() user: { id: string; sid: string }): Promise<void> {
    return this.authService.logout(user.sid);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a new access token using a refresh token' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a password reset link' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto);
    return {
      message:
        'If an account exists with that email, a password reset link has been sent.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using the token from the reset email',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Password has been reset successfully.' };
  }
}
