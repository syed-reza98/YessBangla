import { tableOpAction } from "@/actions/table-op";
import { customerSignUpAction, updateSelfPasswordAction } from "@/actions/auth";
import { signIn, signOut } from "next-auth/react";

export interface QueryResult<T = any> {
  data: T | null;
  error: { message: string } | null;
  count?: number;
}

class QueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
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

  select(_cols: string = "*", _options?: { count?: string; head?: boolean }): QueryBuilder<any[]> {
    this._action = "select";
    return this as any;
  }

  insert(data: any): QueryBuilder<any> {
    this._action = "insert";
    this._data = data;
    return this as any;
  }

  update(data: any): QueryBuilder<any> {
    this._action = "update";
    this._data = data;
    return this as any;
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

  gte(col: string, val: any) {
    this._filters.push({ col, op: "gte", val });
    return this;
  }

  lte(col: string, val: any) {
    this._filters.push({ col, op: "lte", val });
    return this;
  }

  gt(col: string, val: any) {
    this._filters.push({ col, op: "gt", val });
    return this;
  }

  lt(col: string, val: any) {
    this._filters.push({ col, op: "lt", val });
    return this;
  }

  ilike(col: string, val: any) {
    this._filters.push({ col, op: "ilike", val });
    return this;
  }

  like(col: string, val: any) {
    this._filters.push({ col, op: "like", val });
    return this;
  }

  not(col: string, op: string, val: any) {
    this._filters.push({ col, op: `not_${op}`, val });
    return this;
  }

  or(expr: string) {
    this._filters.push({ col: "__or__", op: "or", val: expr });
    return this;
  }

  upsert(data: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this._action = "upsert";
    this._data = { data, options };
    return this;
  }

  in(col: string, val: any[]) {
    this._filters.push({ col, op: "in", val });
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

  single(): QueryBuilder<any> {
    this._single = true;
    return this as any;
  }

  maybeSingle(): QueryBuilder<any> {
    this._maybeSingle = true;
    return this as any;
  }

  private async execute(): Promise<QueryResult<T>> {
    try {
      const json = await tableOpAction({
        table: this.table,
        action: this._action,
        filters: this._filters,
        order: this._order,
        limit: this._limit,
        offset: this._offset,
        single: this._single,
        maybeSingle: this._maybeSingle,
        data: this._data,
      });
      if (json.error && !this._maybeSingle) {
        return { data: null, error: { message: json.error || "DB Error" } };
      }
      return {
        data: json.data as T,
        error: json.error ? { message: json.error } : null,
        count: json.count ?? (Array.isArray(json.data) ? json.data.length : 1),
      };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Network request failed" } };
    }
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
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
              branchId: session.user.branchId || "MAIN",
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error(result.error);
      return { data: result, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  },
  async signUp({ email, password, options }: any) {
    try {
      const res = await customerSignUpAction({
        email,
        password,
        fullName: options?.data?.full_name,
        phone: options?.data?.phone,
      });
      if (!res.ok) {
        return { data: { user: null, session: null }, error: { message: res.error } };
      }
      return {
        data: {
          user: { id: res.userId, email },
          session: null,
        },
        error: null,
      };
    } catch (e: any) {
      return { data: { user: null, session: null }, error: { message: e.message || "Sign up failed" } };
    }
  },
  async updateUser({ password }: { password?: string }) {
    try {
      if (password) {
        const res = await updateSelfPasswordAction({ password });
        if (!res.ok) {
          return { data: { user: null }, error: { message: res.error || "Password update failed" } };
        }
      }
      return { data: { user: null }, error: null };
    } catch (e: any) {
      return { data: { user: null }, error: { message: e.message || "Update failed" } };
    }
  },
  async signOut() {
    try {
      await signOut({ redirect: false });
    } catch {}
    return { error: null };
  },
  onAuthStateChange(_cb: (event: string, session: any) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

export const supabase = {
  from(tableName: string) {
    return new QueryBuilder(tableName);
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
        async createSignedUrl(path: string, _expiresIn?: number) {
          return { data: { signedUrl: `/uploads/${path}` }, error: null };
        },
        async upload(path: string, _file: any, _options?: any) {
          return { data: { path }, error: null };
        },
      };
    },
  },
  channel(_name: string) {
    const ch = {
      on(_event: string, _filter: any, _callback: any) {
        return ch;
      },
      subscribe() {
        return ch;
      },
      unsubscribe() {},
    };
    return ch;
  },
  removeChannel(_channel: any) {},
};

export const supabaseAdmin = supabase;
