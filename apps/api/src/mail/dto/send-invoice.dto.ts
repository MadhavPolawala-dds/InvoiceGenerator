import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendInvoiceDto {
  @IsNotEmpty({ message: 'Enter a valid email.' })
  @IsEmail({}, { message: 'Enter a valid email.' })
  toEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
