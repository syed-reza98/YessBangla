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
import { cn } from "@/lib/utils";

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

function isPathActive(
  pathname: string,
  destination: string,
  activeOptions?: { exact?: boolean; includeSearch?: boolean }
) {
  if (!destination || destination.startsWith("http") || destination.startsWith("#")) {
    return false;
  }
  const pathOnly = destination.split("?")[0].split("#")[0] || "/";
  if (activeOptions?.exact) {
    return pathname === pathOnly;
  }
  if (pathOnly === "/") {
    return pathname === "/";
  }
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
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
  activeProps,
  inactiveProps,
  activeOptions,
  preload: _preload,
  search: _search,
  hash: _hash,
  ...rest
}: any) {
  const pathname = usePathname() || "/";
  let destination = href || to || "/";
  if (params && typeof destination === "string") {
    for (const [k, v] of Object.entries(params)) {
      destination = destination.replace(`$${k}`, String(v));
    }
  }

  const isActive = isPathActive(pathname, String(destination), activeOptions);

  const stateProps = isActive ? activeProps : inactiveProps;
  const mergedClassName = cn(
    className,
    typeof stateProps?.className === "string" ? stateProps.className : undefined
  );
  const mergedStyle =
    style || stateProps?.style
      ? { ...(style || {}), ...(stateProps?.style || {}) }
      : undefined;

  const safeProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (TANSTACK_LINK_ONLY.has(key)) continue;
    if (value === undefined) continue;
    safeProps[key] = value;
  }

  return (
    <NextLink
      href={destination}
      className={mergedClassName}
      style={mergedStyle}
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
      if (options.replace) {
        router.replace(options.to);
      } else {
        router.push(options.to);
      }
    } else if (options?.delta) {
      router.back();
    }
  };
}

export function useLocation<T = any>(opts?: { select?: (location: any) => T }): T {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const searchStr = searchParams?.toString() || "";
  const location = {
    pathname,
    href: searchStr ? `${pathname}?${searchStr}` : pathname,
    search: searchParams ? Object.fromEntries(searchParams.entries()) : {},
    searchStr,
    hash: "",
  };
  return opts?.select ? opts.select(location) : (location as unknown as T);
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
        if (options.replace) {
          router.replace(options.to);
        } else {
          router.push(options.to);
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

export function useParams<T = Record<string, string>>(_opts?: any): T {
  return (useNextParams() || {}) as T;
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

export interface RouteOptionProps {
  loader?: (ctx: { params: Record<string, string>; search?: Record<string, any> }) => any;
  head?: (ctx: { params: Record<string, string>; loaderData?: any }) => any;
  errorComponent?: React.ComponentType<any> | ((ctx: any) => any);
  notFoundComponent?: () => any;
  component?: React.ComponentType<any>;
  validateSearch?: (search: Record<string, any>) => any;
  [key: string]: any;
}

export function createFileRoute(_path: string) {
  return (options: RouteOptionProps) => {
    const routeObj = {
      ...options,
      path: _path,
      useParams: (_opts?: any) => {
        return useNextParams() || {};
      },
      useSearch: () => {
        const searchParams = useSearchParams();
        const searchObj = searchParams ? Object.fromEntries(searchParams.entries()) : {};
        return options?.validateSearch ? options.validateSearch(searchObj) : searchObj;
      },
      useLoaderData: () => {
        const params = useNextParams() || {};
        if (typeof options?.loader === "function") {
          try {
            return options.loader({ params: params as Record<string, string> });
          } catch {
            return {};
          }
        }
        return {};
      },
    };
    return routeObj;
  };
}

export function createRootRoute(options: any) {
  return options;
}
