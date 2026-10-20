import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CustomFieldDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty({ message: 'Label is required.' })
  @IsString()
  @MaxLength(60, { message: 'Label cannot exceed 60 characters.' })
  label!: string;

  @IsString()
  @MaxLength(300, { message: 'Value cannot exceed 300 characters.' })
  value!: string;

  @IsBoolean()
  visible!: boolean;

  @IsInt()
  position!: number;
}
