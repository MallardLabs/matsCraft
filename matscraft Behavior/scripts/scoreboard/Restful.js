import { system, world } from "@minecraft/server"

const Restful = {}

const Dimension = world.getDimension("overworld")
const GetData = {}

/**
 * Restful API
 * @param {string} path 
 * @param {(data: {}) => void} callback 
 */
Restful.listen = (path, callback) => {
  GetData[path] = callback
}

const AnswerGet = (path, data = {}) => {
  Dimension.runCommand(`scriptevent answer-get:${path} ${JSON.stringify(data)}`)
}

system.afterEvents.scriptEventReceive.subscribe(async ({id, message, sourceType}) => {
  if (sourceType != "Server") return
  if (id.startsWith("get:")) {
    let path = id.split(":")[1]
    let dataObj = message ?? "{}"
    let pathCallback = GetData[path]
    if (!pathCallback) return
    let result = await pathCallback(JSON.parse(dataObj))
    AnswerGet(path, result)
  }
})

/**
 * 
 * @param {string} path 
 * @param {{}} data 
 * @param {number} timeout 
 * @returns 
 */
Restful.request = async (path, data = {}, timeout = 10) => {
  let answer = undefined
  let getService = system.afterEvents.scriptEventReceive.subscribe(data => {
    if (data.id == `answer-get:${path}`) {
      answer = JSON.parse(data.message)
      system.afterEvents.scriptEventReceive.unsubscribe(getService)
    }
  })
  await Dimension.runCommandAsync(`scriptevent get:${path} ${JSON.stringify(data)}`)
  return new Promise((resolve) => {
    let done = false
    system.runTimeout(() => { done = true }, 20 * timeout)
    let interval = system.runInterval(() => {
      if (done || answer != undefined) {
        resolve(answer) 
        system.clearRun(interval)
      }
    })
  })
}

export default Restful