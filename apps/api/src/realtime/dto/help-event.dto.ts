import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HelpEventDto {
  @IsString()
  learnerProfileId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  message?: string;
}
