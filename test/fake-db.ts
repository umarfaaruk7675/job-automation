/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A tiny stand-in for the Supabase client. Every chained call is recorded,
 * and awaiting the query asks `respond` for the result.
 */
export type Op = { table: string; calls: { method: string; args: any[] }[] };

export function fakeDb(respond: (op: Op) => { data?: any; error?: any; count?: number }) {
  const log: Op[] = [];
  const db = {
    log,
    from(table: string) {
      const op: Op = { table, calls: [] };
      log.push(op);
      const builder: any = new Proxy({}, {
        get(_t, prop: string) {
          if (prop === "then") return (res: any, rej: any) => Promise.resolve().then(() => respond(op)).then(res, rej);
          return (...args: any[]) => { op.calls.push({ method: prop, args }); return builder; };
        },
      });
      return builder;
    },
  };
  return db;
}

export const has = (op: Op, method: string) => op.calls.some((c) => c.method === method);
export const arg = (op: Op, method: string) => op.calls.find((c) => c.method === method)?.args[0];
