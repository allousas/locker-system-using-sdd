import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus, Injectable,
    Logger,
} from '@nestjs/common';
import {
    DomainException,
    LockerNotFoundError,
} from '@/domain/locker.errors';

@Injectable()
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(DomainExceptionFilter.name);

    catch(exception: DomainException, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();

        if (exception instanceof LockerNotFoundError) {
            return response.status(HttpStatus.NOT_FOUND).json({
                message: 'Locker not found',
            });
        }

        this.logger.error(
            `Unrecognized domain exception: ${exception.constructor.name}`,
            exception.stack,
        );

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Internal server error',
        });
    }
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();

        if (exception instanceof HttpException) {
            return response.status(exception.getStatus()).json({
                message: exception.message,
            });
        }

        if (exception instanceof Error) {
            this.logger.error(exception.message, exception.stack);
        } else {
            this.logger.error(`Unknown exception: ${String(exception)}`);
        }

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Internal server error',
        });
    }
}