/**
 * A simple logging utility that prints messages to the console with a custom label.
 * Supports `info`, `warn`, `error`, and `debug` log levels.
 *
 * Each method accepts a `label` (used as a tag) followed by any number of arguments to log.
 *
 * The `debug` method only logs messages when the environment variable `DEBUG` is set to `"true"`.
 *
 * @interface Logger
 *
 * @method info
 * Logs informational messages to the console.
 *
 * @method warn
 * Logs warning messages to the console.
 *
 * @method error
 * Logs error messages to the console.
 *
 * @method debug
 * Logs debug messages to the console (only if `process.env.DEBUG === "true"`).
 *
 * @param label - A string representing the category or context of the log (e.g., 'info', 'warn').
 * @param args - Any number of arguments to be logged after the label.
 * @returns void
 *
 * @example
 * ```ts
 * logger.info('info', 'This is an info message');
 * logger.warn('warn', 'This is a warning message');
 * logger.error('error', 'This is an error message');
 * logger.debug('debug', 'This is a debug message');
 * ```
 *
 * @output
 * ```
 * [info] This is an info message
 * [warn] This is a warning message
 * [error] This is an error message
 * [debug] This is a debug message // Only if DEBUG=true
 * ```
 */
interface Logger {
  info: (label: string, ...args: any[]) => void;
  warn: (label: string, ...args: any[]) => void;
  error: (label: string, ...args: any[]) => void;
  debug: (label: string, ...args: any[]) => void;
}

const logger: Logger = {
  /*
   * @method info
   * Logs informational messages to the console.
   * @output
   * ```
   * [info] This is an info message
   * ```
   */
  info: (label: string, ...args: any[]) => {
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
  warn: (label: string, ...args: any[]) => {
    console.warn(`[${label}]`, ...args);
  },
  error: (label: string, ...args: any[]) => {
    console.error(`[${label}]`, ...args);
  },
  debug: (label: string, ...args: any[]) => {
    if (process.env.DEBUG === "true") {
      console.debug(`[${label}]`, ...args);
    }
  },
};

export default logger;
