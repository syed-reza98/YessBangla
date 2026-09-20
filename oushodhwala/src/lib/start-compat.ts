// TanStack Start compatibility adapter for oushodhwala

export function createServerFn(_options?: any) {
  let _validator: any = (x: any) => x;
  let _handler: any = (x: any) => x;

  const builder = {
    middleware(_m: any) {
      return builder;
    },
    inputValidator(fn: any) {
      _validator = fn;
      return builder;
    },
    handler(fn: any) {
      _handler = fn;
      const callable: any = async (args: any) => {
        const payload = args?.data !== undefined ? args.data : args;
        const validated = _validator ? _validator(payload) : payload;
        return _handler({ data: validated, context: {} });
      };
      callable.handler = _handler;
      return callable;
    },
  };

  return builder;
}

export function useServerFn(fn: any) {
  return async (args?: any) => {
    if (typeof fn === "function") {
      return fn(args);
    }
    return null;
  };
}

export function createMiddleware(_options?: any) {
  return {
    client: (cb: any) => cb,
    server: (cb: any) => cb,
  };
}

export function getRequest() {
  return {
    headers: {
      get: (_name: string) => null,
    },
  };
}
