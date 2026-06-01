import * as Comlink from "comlink";

/**
 * Thin Comlink wrapper for tool workers. Tools that need heavy off-main-thread
 * work (PDF render, hash large files, image compress, SVGO) define their
 * worker module then call `wrapWorker<API>(() => new Worker(...))` here.
 *
 * Usage in a tool:
 *   const api = wrapWorker<MyApi>(() => new Worker(new URL("./my.worker.ts", import.meta.url), { type: "module" }));
 *   const result = await api.compress(bytes, opts);
 *   api[releaseProxy]();   // when done
 */
export function wrapWorker<T>(factory: () => Worker): Comlink.Remote<T> {
  const worker = factory();
  return Comlink.wrap<T>(worker);
}

export const expose = Comlink.expose;
export const releaseProxy = Comlink.releaseProxy;
export type Remote<T> = Comlink.Remote<T>;
