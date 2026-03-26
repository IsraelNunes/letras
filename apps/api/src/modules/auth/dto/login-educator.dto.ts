import { IsString, MinLength } from 'class-validator';

export class LoginEducatorDto {
  @IsString()
  identifier!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
