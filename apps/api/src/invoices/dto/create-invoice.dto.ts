import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { InvoiceStatus } from '@prisma/client';
import { LineItemDto } from './line-item.dto';
import { CustomFieldDto } from './custom-field.dto';

export class CreateInvoiceDto {
  @IsNotEmpty({ message: 'Invoice number is required.' })
  @IsString()
  @MaxLength(40, { message: 'Invoice number cannot exceed 40 characters.' })
  number!: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsNotEmpty({ message: 'Issue date is required.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Enter a valid issue date (YYYY-MM-DD).' })
  issueDate!: string;

  @IsNotEmpty({ message: 'Due date is required.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Enter a valid due date (YYYY-MM-DD).' })
  dueDate!: string;

  @IsNotEmpty({ message: 'Business name is required.' })
  @IsString()
  @MaxLength(120, { message: 'Business name must be between 1 and 120 characters.' })
  businessName!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email.' })
  businessEmail?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsNotEmpty({ message: 'Customer name is required.' })
  @IsString()
  @MaxLength(120, { message: 'Customer name must be between 1 and 120 characters.' })
  customerName!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email.' })
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Notes cannot exceed 2000 characters.' })
  notes?: string;

  @IsOptional()
  @IsInt({ message: 'Discount must be integer cents.' })
  @Min(0, { message: 'Discount cannot be negative.' })
  discountCents?: number;

  @IsOptional()
  @IsInt({ message: 'Tax rate must be integer basis points.' })
  @Min(0, { message: 'Tax rate must be between 0 and 100.' })
  @Max(10000, { message: 'Tax rate must be between 0 and 100.' })
  taxRateBp?: number;

  // Optional client-provided totals (ignored by server, recomputed via invoice-core)
  @IsOptional()
  @IsInt()
  subtotalCents?: number;

  @IsOptional()
  @IsInt()
  taxCents?: number;

  @IsOptional()
  @IsInt()
  totalCents?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 custom fields allowed.' })
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields?: CustomFieldDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems!: LineItemDto[];
}
