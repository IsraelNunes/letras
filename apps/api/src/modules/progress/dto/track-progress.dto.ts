import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum CompletionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class TrackProgressDto {
  @IsString()
  learnerProfileId!: string;

  @IsString()
  activityId!: string;

  @IsEnum(CompletionStatus)
  status!: CompletionStatus;

  @IsOptional()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  elapsedSeconds?: number;
}
