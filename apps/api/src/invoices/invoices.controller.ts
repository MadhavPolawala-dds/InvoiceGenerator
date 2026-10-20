import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvoicesService } from './invoices.service';
import { MailService } from '../mail/mail.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SendInvoiceDto } from '../mail/dto/send-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly mailService: MailService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  // Throttle to 5 requests per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  send(@Param('id') id: string, @Body() sendInvoiceDto: SendInvoiceDto) {
    return this.mailService.sendInvoice(id, sendInvoiceDto);
  }
}
