import {Code, Locker} from "@/domain/locker.domain";
import {InvalidCodeError, LockerAlreadyLockedError} from "@/domain/locker.errors";

describe('Locker domain', () => {

    describe('Locker', () => {

        let code = Code.reconstitute('1234');

        it('should lock a locker', () => {
            let locked = new Locker('550e8400-e29b-41d4-a716-446655440000',  code, 'unlocked', 1).lock('1234');

            expect(locked.status).toBe('locked');
        });

        it('should carry over the loaded version when locked', () => {
            let locked = new Locker('550e8400-e29b-41d4-a716-446655440000',  code, 'unlocked', 1).lock('1234');

            expect(locked.version).toBe(1);
        });

        it('should not mutate the locker it was locked from', () => {
            let unlocked = new Locker('550e8400-e29b-41d4-a716-446655440000',  code, 'unlocked', 1);

            unlocked.lock('1234');

            expect(unlocked.status).toBe('unlocked');
            expect(unlocked.version).toBe(1);
        });

        it('should fail locking a locker when it is already locked', () => {
            expect(() => new Locker('550e8400-e29b-41d4-a716-446655440000',  code, 'locked', 1).lock('1234'))
                .toThrow(LockerAlreadyLockedError);
        });

    });
    describe('Code', () => {

        it('should create a code', () => {
            expect(() => Code.createFourDigitsCode('1234')).not.toThrow();
        });

        it('should fail creating a code when it is longer than 4 digits', () => {
            expect(() => Code.createFourDigitsCode('12345')).toThrow(InvalidCodeError);
        });

        it('should fail creating a code when it is shorter than 4 digits', () => {
            expect(() => Code.createFourDigitsCode('123')).toThrow(InvalidCodeError);
        });

        it('should fail creating a code when it contains non-digit characters', () => {
            expect(() => Code.createFourDigitsCode('dddd')).toThrow(InvalidCodeError);
        });
    });
});
