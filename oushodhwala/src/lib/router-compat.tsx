"use client";

import NextLink from "next/link";
import {
  useRouter as useNextRouter,
  usePathname,
  useSearchParams,
  useParams as useNextParams,
  notFound as nextNotFound,
  redirect as nextRedirect,
} from "next/navigation";
import React from "react";

/** TanStack Router Link props that must never reach the DOM via next/link. */
const TANSTACK_LINK_ONLY = new Set([
  "activeProps",
  "inactiveProps",
  "activeOptions",
  "preload",
  "search",
  "hash",
  "params",
  "to",
  "from",
  "mask",
  "replace",
  "resetScroll",
  "viewTransition",
  "ignoreBlocker",
]);

function withSearch(destination: string, search?: Record<string, unknown>) {
  if (!search || typeof search !== "object") return destination;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  if (!s) return destination;
  return destination.includes("?") ? `${destination}&${s}` : `${destination}?${s}`;
}

export function Link({
  to,
  href,
  children,
  className,
  style,
  onClick,
  target,
  rel,
  params,
  search,
  activeProps: _activeProps,
  inactiveProps: _inactiveProps,
  activeOptions: _activeOptions,
  preload: _preload,
  hash: _hash,
  ...rest
}: any) {
  let destination = href || to || "/";
  if (params && typeof destination === "string") {
    for (const [k, v] of Object.entries(params)) {
      destination = destination.replace(`$${k}`, String(v));
    }
  }
  destination = withSearch(String(destination), search);

  const safeProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (TANSTACK_LINK_ONLY.has(key)) continue;
    if (value === undefined) continue;
    safeProps[key] = value;
  }

  return (
    <NextLink
      href={destination}
      className={className}
      style={style}
      onClick={onClick}
      target={target}
      rel={rel}
      {...safeProps}
    >
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useNextRouter();
  return (options: any) => {
    if (typeof options === "string") {
      router.push(options);
    } else if (options?.to) {
      const path = withSearch(String(options.to), options.search);
      if (options.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    } else if (options?.delta) {
      router.back();
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || "/";
  // useSearchParams requires Suspense in SSR — use try/catch for SSR safety
  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    // during SSR without Suspense boundary, this may throw — ignore it
  }
  const searchStr = searchParams?.toString() || "";
  return {
    pathname,
    href: searchStr ? `${pathname}?${searchStr}` : pathname,
    search: searchParams ? Object.fromEntries(searchParams.entries()) : {},
    searchStr,
    hash: "",
  };
}

export function useRouter() {
  const router = useNextRouter();
  const location = useLocation();
  return {
    ...router,
    navigate: (options: any) => {
      if (typeof options === "string") {
        router.push(options);
      } else if (options?.to) {
        const path = withSearch(String(options.to), options.search);
        if (options.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }
      }
    },
    invalidate: () => router.refresh(),
    state: {
      location,
    },
  };
}

export function useRouterState({ select }: { select?: (state: any) => any } = {}) {
  const location = useLocation();
  const state = {
    location,
  };
  return select ? select(state) : state;
}

export function useParams() {
  return useNextParams() || {};
}

export function notFound() {
  nextNotFound();
}

export function redirect(options: any) {
  if (typeof options === "string") {
    nextRedirect(options);
  } else if (options?.to) {
    nextRedirect(options.to);
  } else if (options?.href) {
    nextRedirect(options.href);
  }
}

export function Outlet() {
  return null;
}

export function HeadContent() {
  return null;
}

export function Scripts() {
  return null;
}

export function createFileRoute(_path: string) {
  return (options: any) => {
    return {
      ...options,
      path: _path,
      useSearch: () => {
        const searchParams = useSearchParams();
        return searchParams ? Object.fromEntries(searchParams.entries()) : {};
      },
      useNavigate: () => useNavigate(),
      useParams: () => useParams(),
      useLoaderData: () => {
        const params = useNextParams() || {};
        const key = `${_path}:${JSON.stringify(params)}`;
        const [data, setData] = React.useState<any>(() => loaderCache.get(key));
        const [error, setError] = React.useState<unknown>(null);

        React.useEffect(() => {
          let cancelled = false;
          setError(null);
          if (typeof options?.loader !== "function") {
            const empty = {};
            loaderCache.set(key, empty);
            setData(empty);
            return;
          }
          Promise.resolve(options.loader({ params: params as Record<string, string> }))
            .then((result) => {
              if (cancelled) return;
              const value = result ?? {};
              loaderCache.set(key, value);
              setData(value);
            })
            .catch((err) => {
              if (!cancelled) setError(err);
            });
          return () => {
            cancelled = true;
          };
        }, [key]);

        if (error) throw error;
        return data;
      },
    };
  };
}

const loaderCache = new Map<string, unknown>();

export function createRootRoute(options: any) {
  return options;
}

export function createRootRouteWithContext() {
  return (options: any) => {
    return (routeOptions: any) => ({
      ...routeOptions,
      useRouteContext: () => ({ queryClient: undefined }),
      useSearch: () => ({}),
      useNavigate: () => useNavigate(),
      useParams: () => useParams(),
    });
  };
}
