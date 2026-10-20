import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class LineItemDto {
  @IsNotEmpty({ message: 'Add a description.' })
  @IsString()
  @MaxLength(200, { message: 'Description cannot exceed 200 characters.' })
  description!: string;

  @IsInt({ message: 'Quantity must be an integer milli-unit.' })
  @Min(1, { message: 'Quantity must be greater than 0.' })
  @Max(1000000000, { message: 'Quantity cannot exceed 1,000,000.' })
  quantityMilli!: number;

  @IsInt({ message: 'Unit price must be integer cents.' })
  @Min(0, { message: 'Price cannot be negative.' })
  @Max(1000000000, { message: 'Price cannot exceed 10,000,000.00.' })
  unitPriceCents!: number;

  @IsOptional()
  @IsInt()
  position?: number;
}
