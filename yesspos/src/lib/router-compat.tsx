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
  ...props
}: any) {
  let destination = href || to || "/";
  if (params && typeof destination === "string") {
    for (const [k, v] of Object.entries(params)) {
      destination = destination.replace(`$${k}`, String(v));
    }
  }

  return (
    <NextLink
      href={destination}
      className={className}
      style={style}
      onClick={onClick}
      target={target}
      rel={rel}
      {...props}
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

export function useLocation() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
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

export interface RouteOptions {
  server?: any;
  beforeLoad?: (args: any) => any;
  validateSearch?: (input: any) => any;
  loader?: (args: any) => any;
  head?: (args: any) => any;
  component?: React.ComponentType<any>;
  notFoundComponent?: React.ComponentType<any>;
  errorComponent?: React.ComponentType<any>;
  [key: string]: any;
}

export function createFileRoute(_path: string) {
  return (options: RouteOptions) => {
    return {
      ...options,
      path: _path,
      useSearch: () => {
        const searchParams = useSearchParams();
        return (searchParams ? Object.fromEntries(searchParams.entries()) : {}) as any;
      },
      useNavigate: () => useNavigate(),
      useParams: () => useParams(),
    };
  };
}

export function createRootRoute(options: any) {
  return options;
}

export function createRootRouteWithContext<T = any>() {
  return (options?: any) => {
    return {
      ...options,
      useRouteContext: () => ({ queryClient: undefined as any }),
      useSearch: () => ({} as any),
      useNavigate: () => useNavigate(),
      useParams: () => useParams(),
    };
  };
}
