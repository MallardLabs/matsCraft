import { system, world } from "@minecraft/server";
const Restful = {};
const Dimension = world.getDimension("overworld");
const GetData = {};
Restful.listen = (path, callback) => {
    GetData[path] = callback;
};
const AnswerGet = (path, data = {}) => {
    Dimension.runCommand(`scriptevent answer-get:${path} ${JSON.stringify(data)}`);
};
system.afterEvents.scriptEventReceive.subscribe(async ({ id, message, sourceType }) => {
    if (sourceType !== "Server")
        return;
    if (id.startsWith("get:")) {
        const path = id.split(":")[1];
        const dataObj = message ?? "{}";
        const pathCallback = GetData[path];
        if (!pathCallback)
            return;
        const result = await pathCallback(JSON.parse(dataObj));
        AnswerGet(path, result);
    }
});
Restful.request = async (path, data = {}, timeout = 10) => {
    let answer;
    const getService = system.afterEvents.scriptEventReceive.subscribe((event) => {
        if (event.id === `answer-get:${path}`) {
            answer = JSON.parse(event.message);
            system.afterEvents.scriptEventReceive.unsubscribe(getService);
        }
    });
    await Dimension.runCommandAsync(`scriptevent get:${path} ${JSON.stringify(data)}`);
    return new Promise((resolve) => {
        let done = false;
        system.runTimeout(() => (done = true), 20 * timeout);
        const interval = system.runInterval(() => {
            if (done || answer !== undefined) {
                resolve(answer);
                system.clearRun(interval);
            }
        });
    });
};
export default Restful;
