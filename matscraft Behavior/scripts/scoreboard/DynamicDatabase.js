import { world } from "@minecraft/server"

export default class DynamicDatabase {
  /**
     * @param {String} name 
     */
  constructor(name) {
    this.Database = new Map()
    this.DatabaseName = `Database${name}`
    
    const dynamicDatas = world.getDynamicPropertyIds().filter((id) => id.startsWith(`${this.DatabaseName}|`))
    for (const dataId of dynamicDatas) {
      const key = dataId.split("|")[1]
      let value = world.getDynamicProperty(dataId)
      try { value = JSON.parse(value) } catch (e) {}
      this.Database.set(key, value)
    }
    console.warn(`[Database] Loaded ${name}.`)
  }

  /**
   * The length of the database
   * @returns {number}
   */
  get length() {
    return this.Database.size
  }

  /**
   * Get data from Database
   * @param {string} key 
   * @returns {any | undefined}
   */
  get(key) {
    return this.Database.get(key)
  }

  /**
   * Set data from Database
   * @param {string} key 
   * @param {any} value 
   */
  set(key, value) {
    let newValue = value
    if (typeof value == "object") newValue = JSON.stringify(value)

    world.setDynamicProperty(`${this.DatabaseName}|${key}`, newValue)
    return this.Database.set(key, value)
  }

  /**
   * Check data from Database
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    return this.Database.has(key)
  }

  /**
   * Delete data from Database
   * @param {string} key 
   */
  delete(key) {
    world.setDynamicProperty(`${this.DatabaseName}|${key}`)
    return this.Database.delete(key)
  }

  /**
   * Clear all data from Database
   */
  clear() {
    const dynamicDatas = world.getDynamicPropertyIds().filter((id) => id.startsWith(`${this.Database}|`))
    dynamicDatas.forEach((id) => world.setDynamicProperty(id))
    return this.Database.clear()
  }

  /**
   * Get an array of all keys in the database
   * @returns {string[]} An array of all keys in the database
   */
  keys() {
    return this.Database.keys();
  }
  /**
   * Get an array of all values in the database
   * @returns {any[]} An array of all values in the database
   */
  values() {
    return this.Database.values();
  }

  /**
   * Returns all entries
   * @returns {IterableIterator<[string, any]>}
   */
  entries() {
    return this.Database.entries()
  }

  /**
   * Loop through all keys and values of the Database
   * @param {(key: string, value: any) => void} callback Code to run per loop
   */
  forEach(callback) {
    this.Database.forEach(callback)
  }
}