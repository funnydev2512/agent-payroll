import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class EmployeeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  wallet_address!: string;

  @IsNumber()
  @Min(0)
  usdc_amount!: number;
}
