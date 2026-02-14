import definition from 'virtual:user-unlisted-script-entrypoint';
import { initPlugins } from 'virtual:wxt-plugins';

function print(method, ...args) {
  if (import.meta.env.MODE === "production") return;
  if (typeof args[0] === "string") {
    const message = args.shift();
    method(`[wxt] ${message}`, ...args);
  } else {
    method("[wxt]", ...args);
  }
}
const logger = {
  debug: (...args) => print(console.debug, ...args),
  log: (...args) => print(console.log, ...args),
  warn: (...args) => print(console.warn, ...args),
  error: (...args) => print(console.error, ...args)
};

const result = (() => {
  try {
    initPlugins();
  } catch (err) {
    logger.error(
      `Failed to initialize plugins for "${import.meta.env.ENTRYPOINT}"`,
      err
    );
    throw err;
  }
  let result2;
  try {
    result2 = definition.main();
    if (result2 instanceof Promise) {
      result2 = result2.catch((err) => {
        logger.error(
          `The unlisted script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
          err
        );
        throw err;
      });
    }
  } catch (err) {
    logger.error(
      `The unlisted script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      err
    );
    throw err;
  }
  return result2;
})();

export { result as default };
