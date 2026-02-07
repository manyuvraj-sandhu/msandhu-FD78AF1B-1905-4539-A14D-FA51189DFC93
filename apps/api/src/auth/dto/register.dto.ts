import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '@org/data';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  organizationName: string;

  @IsEnum(['owner', 'admin', 'viewer'])
  role: Role;
}
