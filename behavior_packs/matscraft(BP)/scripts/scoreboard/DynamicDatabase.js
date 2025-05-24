import { world } from "@minecraft/server";
export default class DynamicDatabase {
    constructor(name) {
        this.Database = new Map();
        this.DatabaseName = `Database${name}`;
        const dynamicDatas = world.getDynamicPropertyIds().filter(id => id.startsWith(`${this.DatabaseName}|`));
        for (const dataId of dynamicDatas) {
            const key = dataId.split("|")[1];
            const rawValue = world.getDynamicProperty(dataId);
            let value = rawValue === undefined ? null : rawValue;
            try {
                value = JSON.parse(value);
            }
            catch (e) { }
            this.Database.set(key, value);
        }
        console.warn(`[Database] Loaded ${name}.`);
    }
    get length() {
        return this.Database.size;
    }
    get(key) {
        return this.Database.get(key);
    }
    set(key, value) {
        let newValue = typeof value === "object" ? JSON.stringify(value) : String(value);
        world.setDynamicProperty(`${this.DatabaseName}|${key}`, newValue);
        this.Database.set(key, value);
    }
    has(key) {
        return this.Database.has(key);
    }
    delete(key) {
        world.setDynamicProperty(`${this.DatabaseName}|${key}`);
        return this.Database.delete(key);
    }
    clear() {
        const dynamicDatas = world.getDynamicPropertyIds().filter(id => id.startsWith(`${this.DatabaseName}|`));
        dynamicDatas.forEach(id => world.setDynamicProperty(id));
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
