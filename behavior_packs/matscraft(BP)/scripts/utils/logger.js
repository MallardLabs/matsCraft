const log = {
    info: (label, ...args) => {
        console.log(`[${label}]`, ...args);
    },
    warn: (label, ...args) => {
        console.warn(`[${label}]`, ...args);
    },
    error: (label, ...args) => {
        console.error(`[${label}]`, ...args);
    },
    debug: (label, ...args) => {
        if (process.env.DEBUG === 'true') {
            console.debug(`[${label}]`, ...args);
        }
    }
};
export default log;
