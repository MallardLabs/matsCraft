const logger = {
    /*
     * @method info
     * Logs informational messages to the console.
     * @output
     * ```
     * [info] This is an info message
     * ```
     */
    info: (label, ...args) => {
        console.log(`[${label}]`, ...args);
    },
    /*
     * @method warn
     * Logs warning messages to the console.
     * @output
     * ```
     * [warn] This is a warning message
     * ```
     *
     */
    warn: (label, ...args) => {
        console.warn(`[${label}]`, ...args);
    },
    error: (label, ...args) => {
        console.error(`[${label}]`, ...args);
    },
    debug: (label, ...args) => {
        if (process.env.DEBUG === "true") {
            console.debug(`[${label}]`, ...args);
        }
    },
};
export default logger;
