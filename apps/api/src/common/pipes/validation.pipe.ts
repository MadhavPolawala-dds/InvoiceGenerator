import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export interface FormattedError {
  field: string;
  message: string;
}

export function formatValidationErrors(errors: ValidationError[], parent = ''): FormattedError[] {
  const res: FormattedError[] = [];
  for (const err of errors) {
    const path = parent
      ? /^\d+$/.test(err.property)
        ? `${parent}[${err.property}]`
        : `${parent}.${err.property}`
      : err.property;

    if (err.constraints) {
      const msgs = Object.values(err.constraints);
      res.push({
        field: path,
        message: msgs[0],
      });
    }
    if (err.children && err.children.length > 0) {
      res.push(...formatValidationErrors(err.children, path));
    }
  }
  return res;
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (validationErrors: ValidationError[]) => {
      return new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: formatValidationErrors(validationErrors),
      });
    },
  });
}
