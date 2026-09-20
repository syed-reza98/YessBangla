// Unified Database & Auth Adapter for Oushodhwala (Next.js 16 + MySQL + Auth.js)

class QueryBuilder {
  private table: string;
  private _action: string = "select";
  private _filters: Array<{ col: string; op: string; val: any }> = [];
  private _order?: { col: string; ascending: boolean };
  private _limit?: number;
  private _offset?: number;
  private _single: boolean = false;
  private _maybeSingle: boolean = false;
  private _data?: any;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols: string = "*") {
    this._action = "select";
    return this;
  }

  insert(data: any) {
    this._action = "insert";
    this._data = data;
    return this;
  }

  update(data: any) {
    this._action = "update";
    this._data = data;
    return this;
  }

  delete() {
    this._action = "delete";
    return this;
  }

  eq(col: string, val: any) {
    this._filters.push({ col, op: "eq", val });
    return this;
  }

  neq(col: string, val: any) {
    this._filters.push({ col, op: "neq", val });
    return this;
  }

  in(col: string, val: any[]) {
    this._filters.push({ col, op: "in", val });
    return this;
  }

  like(col: string, val: string) {
    this._filters.push({ col, op: "like", val });
    return this;
  }

  ilike(col: string, val: string) {
    this._filters.push({ col, op: "ilike", val });
    return this;
  }

  gte(col: string, val: any) {
    this._filters.push({ col, op: "gte", val });
    return this;
  }

  lte(col: string, val: any) {
    this._filters.push({ col, op: "lte", val });
    return this;
  }

  or(expr: string) {
    this._filters.push({ col: "", op: "or", val: expr });
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this._action = "upsert";
    this._data = data;
    if (options?.onConflict) {
      (this as any)._onConflict = options.onConflict;
    }
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this._order = { col, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  range(from: number, to: number) {
    this._offset = from;
    this._limit = to - from + 1;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  private async execute(): Promise<any> {
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: this.table,
          action: this._action,
          filters: this._filters,
          order: this._order,
          limit: this._limit,
          offset: this._offset,
          single: this._single,
          maybeSingle: this._maybeSingle,
          data: this._data,
          onConflict: (this as any)._onConflict,
        }),
      });
      const json = await res.json();
      if (!res.ok && !this._maybeSingle) {
        return { data: null, error: { message: json.error || "DB Error" } };
      }
      return {
        data: json.data,
        error: json.error ? { message: json.error } : null,
        count: json.count ?? (Array.isArray(json.data) ? json.data.length : 1),
      };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Network request failed" } };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class RealtimeChannel {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }
  on(_event: string, _filter: any, _callback: (payload: any) => void) {
    return this;
  }
  subscribe(callback?: (status: string) => void) {
    if (callback) setTimeout(() => callback("SUBSCRIBED"), 50);
    return this;
  }
  unsubscribe() {
    return Promise.resolve();
  }
}

const auth = {
  async getUser() {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return { data: { user: null }, error: null };
      const session = await res.json();
      if (!session?.user) return { data: { user: null }, error: null };
      return {
        data: {
          user: {
            id: session.user.id || session.user.email,
            email: session.user.email,
            user_metadata: {
              role: session.user.role || "customer",
            },
          },
        },
        error: null,
      };
    } catch {
      return { data: { user: null }, error: null };
    }
  },
  async getSession() {
    const { data } = await this.getUser();
    return { data: { session: data.user ? { user: data.user } : null }, error: null };
  },
  async signInWithPassword({ email, password }: any) {
    try {
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Invalid credentials");
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  },
  async signOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
    return { error: null };
  },
  onAuthStateChange(_cb: any) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  async updateUser(_updates: any) {
    return { data: { user: null }, error: null };
  },
  async resetPasswordForEmail(_email: string, _options?: any) {
    return { data: {}, error: null };
  },
};

export const supabase = {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  },
  channel(name: string) {
    return new RealtimeChannel(name);
  },
  removeChannel(_channel: any) {
    return Promise.resolve();
  },
  async rpc(_name: string, _params?: any) {
    return { data: null, error: null };
  },
  auth,
  storage: {
    from(_bucket: string) {
      return {
        getPublicUrl(path: string) {
          return { data: { publicUrl: `/uploads/${path}` } };
        },
        async upload(path: string, _file: any) {
          return { data: { path }, error: null };
        },
        async download(path: string) {
          try {
            const url = path.startsWith("http") ? path : `/uploads/${path}`;
            const res = await fetch(url);
            if (!res.ok) return { data: null, error: new Error(`Failed to download ${path}`) };
            const blob = await res.blob();
            return { data: blob, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        },
      };
    },
  },
};

export const supabaseAdmin = supabase;
