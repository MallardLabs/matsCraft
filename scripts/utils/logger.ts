interface Logger {
  info: (label: string, ...args: any[]) => void;
  warn: (label: string, ...args: any[]) => void;
  error: (label: string, ...args: any[]) => void;
  debug: (label: string, ...args: any[]) => void;
}

const log: Logger = {
  info: (label: string, ...args: any[]) => {
    console.log(`[${label}]`, ...args);
  },
  warn: (label: string, ...args: any[]) => {
    console.warn(`[${label}]`, ...args);
  },
  error: (label: string, ...args: any[]) => {
    console.error(`[${label}]`, ...args);
  },
  debug: (label: string, ...args: any[]) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${label}]`, ...args);
    }
  }
};

export default log;
