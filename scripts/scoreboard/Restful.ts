import { system, world } from "@minecraft/server";

interface Callback {
  (data: Record<string, unknown>): Promise<Record<string, unknown>> | Record<string, unknown>;
}

const Restful = {} as {
  listen: (path: string, callback: Callback) => void;
  request: (path: string, data?: Record<string, unknown>, timeout?: number) => Promise<Record<string, unknown> | undefined>;
};

const Dimension = world.getDimension("overworld");
const GetData: Record<string, Callback> = {};

Restful.listen = (path: string, callback: Callback) => {
  GetData[path] = callback;
};

const AnswerGet = (path: string, data: Record<string, unknown> = {}) => {
  Dimension.runCommand(`scriptevent answer-get:${path} ${JSON.stringify(data)}`);
};

system.afterEvents.scriptEventReceive.subscribe(async ({ id, message, sourceType }) => {
  if (sourceType !== "Server") return;
  if (id.startsWith("get:")) {
    const path = id.split(":")[1];
    const dataObj = message ?? "{}";
    const pathCallback = GetData[path];
    if (!pathCallback) return;
    const result = await pathCallback(JSON.parse(dataObj));
    AnswerGet(path, result);
  }
});

Restful.request = async (path, data: Record<string, unknown> = {}, timeout = 10): Promise<Record<string, unknown> | undefined> => {
  let answer: Record<string, unknown> | undefined;

  const getService = system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === `answer-get:${path}`) {
      answer = JSON.parse(event.message);
      system.afterEvents.scriptEventReceive.unsubscribe(getService);
    }
  });

  await Dimension.runCommand(`scriptevent get:${path} ${JSON.stringify(data)}`);

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
