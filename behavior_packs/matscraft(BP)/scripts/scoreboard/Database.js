import { world, ScoreboardIdentityType } from "@minecraft/server";
export class Database {
    constructor(name) {
        this.onSetCallback = [];
        this.onSet = {
            subscribe: (callback) => {
                this.onSetCallback.push(callback);
                return { callback };
            },
            unsubscribe: (listener) => {
                const index = this.onSetCallback.indexOf(listener.callback);
                if (index !== -1) {
                    this.onSetCallback.splice(index, 1);
                }
            }
        };
        this.Database = new Map();
        const objectiveName = `Database:${name}`;
        let objective = world.scoreboard.getObjective(objectiveName);
        if (!objective) {
            objective = world.scoreboard.addObjective(objectiveName, objectiveName);
        }
        for (const participant of objective.getParticipants()) {
            if (participant.type === ScoreboardIdentityType.FakePlayer) {
                const [key, value] = participant.displayName.split("\n_`Split`_\n");
                try {
                    this.Database.set(key, JSON.parse(value));
                }
                catch {
                    this.Database.set(key, value);
                }
            }
        }
    }
    get length() {
        return this.Database.size;
    }
    get(key) {
        return this.Database.get(key);
    }
    set(key, value) {
        this.onSetCallback.forEach(callback => callback({ key, value }));
        const stringified = JSON.stringify(value);
        const participant = `${key}\n_Split_\n${stringified}`;
        const objective = world.scoreboard.getObjective(`Database:${key}`);
        if (objective)
            objective.setScore(participant, 0);
        this.Database.set(key, value);
    }
    has(key) {
        return this.Database.has(key);
    }
    delete(key) {
        const result = this.Database.delete(key);
        const objective = world.scoreboard.getObjective(`Database:${key}`);
        const participants = objective?.getParticipants();
        for (const p of participants ?? []) {
            if (p.displayName.startsWith(`${key}\n_`)) {
                objective?.removeParticipant(p);
            }
        }
        return result;
    }
    clear() {
        this.Database.clear();
    }
    keys() {
        return this.Database.keys();
    }
    values() {
        return this.Database.values();
    }
    entries() {
        return this.Database.entries();
    }
    forEach(callback) {
        for (const [key, value] of this.Database.entries()) {
            callback(key, value);
        }
    }
}
