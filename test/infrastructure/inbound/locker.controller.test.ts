import {INestApplication} from "@nestjs/common";
import {Test} from "@nestjs/testing";
import * as request from 'supertest';
import {LockerController} from "@/infrastructure/inbound/locker.controller";
import {LockUseCase} from "@/application/use-cases/lock.use-case";

describe('LockerController', () => {

    let app: INestApplication;

    const lockUseCaseMock = {
        execute: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [LockerController],
            providers: [
                {
                    provide: LockUseCase,
                    useValue: lockUseCaseMock,
                },
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('PATCH /lockers/:id/lock should lock the locker', async () => {
        const id = '550e8400-e29b-41d4-a716-446655440000';

        await request(app.getHttpServer())
            .patch(`/lockers/${id}/lock`)
            .send({ code: '1234' })
            .expect(204);

        expect(lockUseCaseMock.execute).toHaveBeenCalledWith(id, '1234');
    })
});
