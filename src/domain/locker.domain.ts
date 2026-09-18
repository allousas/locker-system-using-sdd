import {InvalidCodeError, InvalidCodeReason, LockerAlreadyLockedError} from "@/domain/locker.errors";

export class Locker {
    constructor(
        public readonly id: string,
        public readonly code: Code,
        public readonly status: 'locked' | 'unlocked',
        public readonly version: number,
    ) {}

    // A state change carries the version it was loaded from: the repository advances it on write and
    // rejects the write when that version is no longer the stored one (optimistic locking).
    lock(code: string): Locker {
        if('locked' == this.status) throw new LockerAlreadyLockedError(this.id);
        return new Locker(this.id, Code.createFourDigitsCode(code), 'locked', this.version);
    }
}

export class Code {
    private constructor(public readonly value: string)
    {}

    static reconstitute(value: string): Code {
        return new Code(value);
    }

   static createFourDigitsCode(code: string): Code {
       if (!/^\d+$/.test(code)) throw new InvalidCodeError(InvalidCodeReason.INVALID_CHARACTERS);
       if (code.length !== 4) throw new InvalidCodeError(InvalidCodeReason.INVALID_LENGTH);

       return new Code(code);
    }
}
