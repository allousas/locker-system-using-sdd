-- migrate:up
CREATE TABLE lockers (
    id      UUID    PRIMARY KEY,
    code    TEXT    NOT NULL,
    status  TEXT    NOT NULL CHECK (status IN ('locked', 'unlocked')),
    version INTEGER NOT NULL DEFAULT 1
);

-- migrate:down
DROP TABLE lockers;
