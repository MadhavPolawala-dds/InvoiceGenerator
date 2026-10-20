import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

interface FieldError {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: FieldError[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || message;

        if (resObj.errors && Array.isArray(resObj.errors)) {
          errors = resObj.errors;
          message = resObj.message || 'Validation failed';
        } else if (exception instanceof BadRequestException && Array.isArray(resObj.message)) {
          message = 'Validation failed';
          errors = this.formatClassValidatorErrors(resObj.message);
        }
      }
    } else if (exception instanceof Error) {
      // Domain errors or unexpected errors
      message = exception.message || 'An unexpected error occurred';
      if (message.includes('Discount cannot exceed') || message.includes('Quantity must be greater') || message.includes('Price cannot be negative') || message.includes('Tax rate must be between')) {
        status = HttpStatus.BAD_REQUEST;
        errors = [{ field: 'totals', message }];
      }
    }

    // Never leak secrets or internal database connection strings
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'Internal server error';
      errors = undefined;
    }

    const payload: Record<string, any> = {
      statusCode: status,
      message,
    };

    if (errors && errors.length > 0) {
      payload.errors = errors;
    }

    response.status(status).json(payload);
  }

  private formatClassValidatorErrors(rawMessages: string[]): FieldError[] {
    return rawMessages.map((msg) => {
      // Example messages: "lineItems.0.quantityMilli must be an integer", "businessName should not be empty"
      // Format as { field, message }
      const firstSpace = msg.indexOf(' ');
      if (firstSpace !== -1) {
        let field = msg.substring(0, firstSpace);
        const message = msg.substring(firstSpace + 1);

        // Convert dot notation like lineItems.0.quantityMilli to lineItems[0].quantityMilli
        field = field.replace(/\.(\d+)\./g, '[$1].').replace(/\.(\d+)$/g, '[$1]');

        // Capitalize first letter of message
        const capitalizedMsg = message.charAt(0).toUpperCase() + message.slice(1);
        return { field, message: `${capitalizedMsg}.` };
      }
      return { field: 'unknown', message: msg };
    });
  }
}
