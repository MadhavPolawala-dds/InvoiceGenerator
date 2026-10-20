import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailJSDriver } from './drivers/emailjs.driver';
import { SmtpDriver } from './drivers/smtp.driver';

@Module({
  providers: [MailService, EmailJSDriver, SmtpDriver],
  exports: [MailService],
})
export class MailModule {}
