import {Body, Controller, HttpCode, Param, ParseUUIDPipe, Patch} from "@nestjs/common";
import {LockUseCase} from "@/application/use-cases/lock.use-case";

@Controller('lockers')
export class LockerController {

    constructor(private readonly lock: LockUseCase) {}

    @HttpCode(204)
    @Patch(':id/lock')
    async lockLocker(@Param('id', ParseUUIDPipe) id: string, @Body() body: LockLockerHttpDto) {
        await this.lock.execute(id, body.code);
    }
}

export interface LockLockerHttpDto {
    code: string;
}