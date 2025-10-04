import { Catch, ArgumentsHost, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';

@Catch(NotFoundException)
export class SpaFallbackFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (request.method === 'GET') {
      return response.sendFile(join(process.cwd(), 'public', 'index.html'));
    }

    return response.status(404).json({ message: 'Not Found' });
  }
}