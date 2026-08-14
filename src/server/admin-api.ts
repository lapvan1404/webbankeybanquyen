import { createId, getStore, writeStore, type StoreData } from "./admin-store";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || "Admin@1234";
const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || "Quản trị viên";
const BACKEND_API_BASE_URL = process.env.ADMIN_BACKEND_API_URL?.trim() || "http://localhost:4000";
const SESSION_COOKIE = "admin_session";
const sessions = new Map<
  string,
  { email: string; createdAt: number; backendCookieHeader?: string; backendRole?: string }
>();
const notificationSubscribers = new Set<(event: string) => void>();
const storeUpdateSubscribers = new Set<(event: string) => void>();

type StoreUpdateEvent = {
  type: "products" | "categories" | "brands" | "banners";
  action: "create" | "update" | "delete";
  id?: string;
};

function sendStoreUpdate(event: StoreUpdateEvent) {
  const payload = JSON.stringify(event);
  for (const send of storeUpdateSubscribers) {
    send(payload);
  }
}

async function proxyToBackend(
  path: string,
  method: string,
  cookieHeader: string,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {
    Cookie: cookieHeader,
  };
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "application/json";
  const text = await response.text();

  if (response.ok && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    const resourceType = path.includes("banners") ? "banners" : "categories";
    sendStoreUpdate({ type: resourceType, action: "update" });
  }

  return new Response(text, {
    status: response.status,
    headers: { "content-type": contentType },
  });
}

function toPublicAssetPath(value: string | undefined | null) {
  if (!value) return value ?? "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  if (value.startsWith("uploads/")) {
    return `/api/upload/object?key=${encodeURIComponent(value)}`;
  }
  return value;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractBackendCookies(response: Response): string[] {
  const headerBag = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headerBag.getSetCookie === "function") {
    return headerBag.getSetCookie();
  }

  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function buildCookieHeader(setCookies: string[]): string | undefined {
  const cookies = setCookies
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter((value): value is string => Boolean(value));
  return cookies.length ? cookies.join("; ") : undefined;
}

async function loginToBackend(email: string, password: string) {
  const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string; data?: { accessToken?: string } }
    | null;

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      message: payload?.message ?? "Đăng nhập backend thất bại",
    };
  }

  const accessToken = payload?.data?.accessToken;
  const role =
    typeof accessToken === "string"
      ? (decodeJwtPayload(accessToken)?.role as string | undefined)?.toLowerCase()
      : undefined;

  return {
    ok: true as const,
    role,
    cookieHeader: buildCookieHeader(extractBackendCookies(response)),
  };
}

function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((chunk) => {
    const [key, ...rest] = chunk.split("=");
    if (!key) return;
    cookies[key.trim()] = decodeURIComponent(rest.join("=").trim());
  });
  return cookies;
}

function getAdminSession(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return sessions.get(token) ?? null;
}

function createResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...init.headers },
    ...init,
  });
}

function createError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sendNotificationObj(notification: {
  id: string;
  message: string;
  type: StoreData["notifications"][number]["type"];
  orderId?: string;
  createdAt: string;
  read: boolean;
}) {
  const event = JSON.stringify(notification);
  for (const notify of notificationSubscribers) {
    notify(event);
  }
}

export async function handleAdminApi(request: Request) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  if (pathname === "/api/admin/login" && request.method === "POST") {
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      const raw = await request.text().catch(() => "");
      console.error("admin-api: failed to parse JSON body for /api/admin/login", raw);
      return createError(400, "Invalid JSON");
    }
    let backendLogin: Awaited<ReturnType<typeof loginToBackend>> | null = null;
    try {
      backendLogin = await loginToBackend(body.email, body.password);
    } catch (err) {
      console.error('admin-api: backend login attempt failed', err);
      backendLogin = null;
    }

    if (backendLogin && backendLogin.ok) {
      if (backendLogin.role !== "admin") {
        return createError(403, "Tài khoản không có quyền admin");
      }

      const token = createId("session");
      sessions.set(token, {
        email: body.email,
        createdAt: Date.now(),
        backendCookieHeader: backendLogin.cookieHeader,
        backendRole: backendLogin.role,
      });

      return createResponse(
        { authenticated: true, name: ADMIN_NAME },
        {
          headers: {
            "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax`,
          },
        },
      );
    }

    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      return createError(401, backendLogin?.message || "Email hoặc mật khẩu không đúng");
    }

    const token = createId("session");
    sessions.set(token, { email: ADMIN_EMAIL, createdAt: Date.now() });

    // Try to log in to backend with the same admin credentials so we can
    // forward backend auth cookies for uploads and other proxied admin calls.
    try {
      const backendLoginAttempt = await loginToBackend(ADMIN_EMAIL, ADMIN_PASSWORD);
      if (backendLoginAttempt.ok) {
        const existing = sessions.get(token);
        if (existing) {
          existing.backendCookieHeader = backendLoginAttempt.cookieHeader;
          existing.backendRole = backendLoginAttempt.role;
          sessions.set(token, existing);
        }
      }
    } catch (err) {
      // Non-fatal: continue without backend cookies if the backend is unavailable.
      console.error('admin-api: backend login attempt failed for local admin fallback', err);
    }

    return createResponse(
      { authenticated: true, name: ADMIN_NAME },
      {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax`,
        },
      },
    );
  }

  if (pathname === "/api/admin/logout" && request.method === "POST") {
    const session = getAdminSession(request);
    if (session?.backendCookieHeader) {
      await fetch(`${BACKEND_API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Cookie: session.backendCookieHeader },
      }).catch(() => undefined);
    }

    if (session) {
      const cookies = parseCookies(request.headers.get("cookie"));
      const token = cookies[SESSION_COOKIE];
      if (token) sessions.delete(token);
    }
    return createResponse(
      { authenticated: false },
      {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE}=deleted; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
        },
      },
    );
  }

  if (!pathname.startsWith("/api/admin/")) {
    return createError(404, "Not found");
  }

  if (!getAdminSession(request)) {
    return createError(401, "Unauthorized");
  }

  if (pathname === "/api/admin/session" && request.method === "GET") {
    return createResponse({ authenticated: true, name: ADMIN_NAME });
  }

  if (pathname === "/api/admin/upload/image" && request.method === "POST") {
    const session = getAdminSession(request);

    const headers: Record<string, string> = {};
    // If we already have backend cookies from a prior login, forward them.
    if (session?.backendCookieHeader) {
      headers.Cookie = session.backendCookieHeader;
    } else {
      try {
        const attempt = await loginToBackend(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (attempt.ok && attempt.cookieHeader) {
          headers.Cookie = attempt.cookieHeader;
          if (session) {
            session.backendCookieHeader = attempt.cookieHeader;
            session.backendRole = attempt.role;
          }
        }
      } catch (err) {
        /* ignore backend login failure */
      }
    }

    const fileArrayBuffer = await request.arrayBuffer();
    const requestContentType = request.headers.get("content-type") ?? "";

    const sendUpload = async (cookieHeader?: string) => {
      const uploadHeaders: Record<string, string> = {};
      if (cookieHeader) uploadHeaders.Cookie = cookieHeader;
      if (requestContentType) uploadHeaders["content-type"] = requestContentType;
      return fetch(`${BACKEND_API_BASE_URL}/api/upload/image`, {
        method: "POST",
        headers: uploadHeaders,
        body: fileArrayBuffer,
      });
    };

    let response = await sendUpload(headers.Cookie);

    if (response.status === 401) {
      try {
        const attempt = await loginToBackend(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (attempt.ok && attempt.cookieHeader) {
          if (session) session.backendCookieHeader = attempt.cookieHeader;
          response = await sendUpload(attempt.cookieHeader);
        }
      } catch {
        // continue
      }
    }
    const contentType = response.headers.get("content-type") ?? "application/json";
    const bodyText = await response.text();

    if (contentType.includes("application/json")) {
      let parsed: any;
      try {
        parsed = JSON.parse(bodyText);
      } catch (err) {
        // If backend returned invalid JSON, forward the raw body to avoid throwing here
        return new Response(bodyText, {
          status: response.status,
          headers: { "content-type": contentType },
        });
      }

      if (response.ok && typeof parsed?.data?.objectKey === "string") {
        parsed.data.url = toPublicAssetPath(parsed.data.objectKey);
      }

      return new Response(JSON.stringify(parsed), {
        status: response.status,
        headers: { "content-type": contentType },
      });
    }

    return new Response(bodyText, {
      status: response.status,
      headers: { "content-type": contentType },
    });
  }

  if (pathname.startsWith("/api/admin/upload/") && request.method === "DELETE") {
    const session = getAdminSession(request);

    const id = pathname.split("/").pop();
    const headers: Record<string, string> = {};
    if (session?.backendCookieHeader) headers.Cookie = session.backendCookieHeader;
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/upload/${id}`, {
      method: "DELETE",
      headers,
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  }

  if (pathname === "/api/admin/dashboard" && request.method === "GET") {
    const store = await getStore();
    let productCount = store.products.length;
    let categoryCount = store.categories.length;

    try {
      const pRes = await fetch(`${BACKEND_API_BASE_URL}/api/products?pageSize=1`);
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (typeof pJson.data?.total === "number") {
          productCount = pJson.data.total;
        } else if (Array.isArray(pJson.data?.data)) {
          productCount = pJson.data.data.length;
        }
      }
    } catch {
      // ignore
    }

    try {
      const cRes = await fetch(`${BACKEND_API_BASE_URL}/api/categories?pageSize=1`);
      if (cRes.ok) {
        const cJson = await cRes.json();
        if (typeof cJson.data?.total === "number") {
          categoryCount = cJson.data.total;
        } else if (Array.isArray(cJson.data)) {
          categoryCount = cJson.data.length;
        }
      }
    } catch {
      // ignore
    }

    const unread = store.notifications.filter((notification) => !notification.read).length;
    return createResponse({
      orderCount: store.orders.length,
      productCount,
      categoryCount,
      couponCount: store.coupons.length,
      notificationCount: unread,
    });
  }

  if (pathname === "/api/admin/notifications" && request.method === "GET") {
    const store = await getStore();
    return createResponse(
      store.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  if (pathname.startsWith("/api/admin/notifications/") && request.method === "POST") {
    const id = pathname.split("/").pop();
    if (!id) return createError(400, "Invalid notification id");
    const store = await getStore();
    const notification = store.notifications.find((item) => item.id === id);
    if (!notification) return createError(404, "Notification not found");
    notification.read = true;
    await writeStore(store);
    return createResponse(notification);
  }

  if (pathname === "/api/admin/orders" && request.method === "GET") {
    const store = await getStore();
    return createResponse(store.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  if (pathname.startsWith("/api/admin/orders/") && request.method === "PATCH") {
    const id = pathname.split("/").pop();
    if (!id) return createError(400, "Invalid order id");
    const body = await request.json();
    const store = await getStore();
    const order = store.orders.find((item) => item.id === id);
    if (!order) return createError(404, "Order not found");
    if (body.status && ["pending", "paid", "approved", "cancelled"].includes(body.status)) {
      order.status = body.status;
      await writeStore(store);
      if (order.status === "approved") {
        const productNames = order.items
          .map((item: { name: string }) => item.name)
          .filter(Boolean)
          .join(", ");
        const notificationMessage = productNames
          ? `Đơn hàng đã được duyệt: ${productNames}`
          : `Đơn hàng ${order.id} đã được duyệt thanh toán`;
        const notification = {
          id: createId("notify"),
          message: notificationMessage,
          type: "payment" as const,
          orderId: order.id,
          createdAt: new Date().toISOString(),
          read: false,
        };
        store.notifications.push(notification);
        await writeStore(store);
        sendNotificationObj(notification);
      }
      return createResponse(order);
    }
    return createError(400, "Invalid status");
  }

  // --- Products: proxy to backend ---
  if (pathname === "/api/admin/products" && request.method === "GET") {
    try {
      const resp = await fetch(`${BACKEND_API_BASE_URL}/api/products?pageSize=100`);
      if (resp.ok) {
        const bodyText = await resp.text();
        return new Response(bodyText, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    } catch {
      // fall back to local store
    }
    const store = await getStore();
    return createResponse(store.products);
  }

  if (pathname === "/api/admin/products" && request.method === "POST") {
    const session = getAdminSession(request);
    const body = await request.json();
    let backendCookie = session?.backendCookieHeader;
    if (!backendCookie) {
      try {
        const attempt = await loginToBackend(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (attempt.ok && attempt.cookieHeader) {
          backendCookie = attempt.cookieHeader;
          if (session) session.backendCookieHeader = attempt.cookieHeader;
        }
      } catch {
        /* ignore */
      }
    }
    if (backendCookie) {
      const response = await proxyToBackend(`/api/admin/products`, "POST", backendCookie, body);
      sendStoreUpdate({ type: "products", action: "create" });
      return response;
    }
    const store = await getStore();
    const product = { id: createId("prod"), ...body };
    store.products.push(product);
    await writeStore(store);
    sendStoreUpdate({ type: "products", action: "create" });
    return createResponse(product);
  }

  if (pathname.startsWith("/api/admin/products/") && request.method === "PUT") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    const body = await request.json();
    let backendCookie = session?.backendCookieHeader;
    if (!backendCookie) {
      try {
        const attempt = await loginToBackend(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (attempt.ok && attempt.cookieHeader) {
          backendCookie = attempt.cookieHeader;
          if (session) session.backendCookieHeader = attempt.cookieHeader;
        }
      } catch {
        /* ignore */
      }
    }
    if (backendCookie) {
      const response = await proxyToBackend(`/api/admin/products/${id}`, "PUT", backendCookie, body);
      sendStoreUpdate({ type: "products", action: "update", id: String(id) });
      return response;
    }
    const store = await getStore();
    const product = store.products.find((item) => item.id === id);
    if (!product) return createError(404, "Product not found");
    Object.assign(product, body);
    await writeStore(store);
    sendStoreUpdate({ type: "products", action: "update", id: String(id) });
    return createResponse(product);
  }

  if (pathname.startsWith("/api/admin/products/") && request.method === "DELETE") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    let backendCookie = session?.backendCookieHeader;
    if (!backendCookie) {
      try {
        const attempt = await loginToBackend(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (attempt.ok && attempt.cookieHeader) {
          backendCookie = attempt.cookieHeader;
          if (session) session.backendCookieHeader = attempt.cookieHeader;
        }
      } catch {
        /* ignore */
      }
    }
    if (backendCookie) {
      const response = await proxyToBackend(`/api/admin/products/${id}`, "DELETE", backendCookie);
      sendStoreUpdate({ type: "products", action: "delete", id: String(id) });
      return response;
    }
    const store = await getStore();
    const position = store.products.findIndex((item) => item.id === id);
    if (position === -1) return createError(404, "Product not found");
    const [deleted] = store.products.splice(position, 1);
    await writeStore(store);
    sendStoreUpdate({ type: "products", action: "delete", id: String(id) });
    return createResponse(deleted);
  }

  // --- Categories: proxy to backend ---
  if (pathname === "/api/admin/categories" && request.method === "GET") {
    try {
      const resp = await fetch(`${BACKEND_API_BASE_URL}/api/categories?pageSize=100`);
      if (resp.ok) {
        const bodyText = await resp.text();
        return new Response(bodyText, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    } catch {
      // ignore proxy errors and fall back to local store
    }
    const store = await getStore();
    return createResponse(store.categories);
  }

  if (pathname === "/api/admin/categories" && request.method === "POST") {
    const session = getAdminSession(request);
    const body = await request.json();
    if (session?.backendCookieHeader) {
      const response = await proxyToBackend(`/api/admin/categories`, "POST", session.backendCookieHeader, body);
      sendStoreUpdate({ type: "categories", action: "create" });
      return response;
    }
    const store = await getStore();
    const category = { id: createId("category"), ...body };
    store.categories.push(category);
    await writeStore(store);
    sendStoreUpdate({ type: "categories", action: "create" });
    return createResponse(category);
  }

  if (pathname.startsWith("/api/admin/categories/") && request.method === "PUT") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    const body = await request.json();
    if (session?.backendCookieHeader) {
      const response = await proxyToBackend(`/api/admin/categories/${id}`, "PUT", session.backendCookieHeader, body);
      sendStoreUpdate({ type: "categories", action: "update", id: String(id) });
      return response;
    }
    const store = await getStore();
    const category = store.categories.find((item) => item.id === id);
    if (!category) return createError(404, "Category not found");
    Object.assign(category, body);
    await writeStore(store);
    sendStoreUpdate({ type: "categories", action: "update", id: String(id) });
    return createResponse(category);
  }

  if (pathname.startsWith("/api/admin/categories/") && request.method === "DELETE") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    if (session?.backendCookieHeader) {
      const response = await proxyToBackend(`/api/admin/categories/${id}`, "DELETE", session.backendCookieHeader);
      sendStoreUpdate({ type: "categories", action: "delete", id: String(id) });
      return response;
    }
    const store = await getStore();
    const position = store.categories.findIndex((item) => item.id === id);
    if (position === -1) return createError(404, "Category not found");
    const [deleted] = store.categories.splice(position, 1);
    await writeStore(store);
    sendStoreUpdate({ type: "categories", action: "delete", id: String(id) });
    return createResponse(deleted);
  }

  // --- Brands: proxy to backend ---
  if (pathname === "/api/admin/brands" && request.method === "GET") {
    try {
      const resp = await fetch(`${BACKEND_API_BASE_URL}/api/brands?pageSize=100`);
      if (resp.ok) {
        const bodyText = await resp.text();
        return new Response(bodyText, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    } catch {
      // ignore
    }
    const store = await getStore();
    return createResponse(store.brands);
  }

  if (pathname === "/api/admin/brands" && request.method === "POST") {
    const session = getAdminSession(request);
    const body = await request.json();
    if (session?.backendCookieHeader) {
      return proxyToBackend(`/api/admin/brands`, "POST", session.backendCookieHeader, body);
    }
    const store = await getStore();
    const brand = { id: createId("brand"), ...body };
    store.brands.push(brand);
    await writeStore(store);
    return createResponse(brand);
  }

  if (pathname.startsWith("/api/admin/brands/") && request.method === "PUT") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    const body = await request.json();
    if (session?.backendCookieHeader) {
      return proxyToBackend(`/api/admin/brands/${id}`, "PUT", session.backendCookieHeader, body);
    }
    const store = await getStore();
    const brand = store.brands.find((item) => item.id === id);
    if (!brand) return createError(404, "Brand not found");
    Object.assign(brand, body);
    await writeStore(store);
    return createResponse(brand);
  }

  if (pathname.startsWith("/api/admin/brands/") && request.method === "DELETE") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    if (session?.backendCookieHeader) {
      return proxyToBackend(`/api/admin/brands/${id}`, "DELETE", session.backendCookieHeader);
    }
    const store = await getStore();
    const position = store.brands.findIndex((item) => item.id === id);
    if (position === -1) return createError(404, "Brand not found");
    const [deleted] = store.brands.splice(position, 1);
    await writeStore(store);
    return createResponse(deleted);
  }

  if (pathname === "/api/admin/coupons" && request.method === "GET") {
    const store = await getStore();
    return createResponse(store.coupons);
  }

  if (pathname === "/api/admin/coupons" && request.method === "POST") {
    const body = await request.json();
    const store = await getStore();
    const coupon = { id: createId("coupon"), ...body };
    store.coupons.push(coupon);
    await writeStore(store);
    return createResponse(coupon);
  }

  if (pathname.startsWith("/api/admin/coupons/") && request.method === "PUT") {
    const id = pathname.split("/").pop();
    const body = await request.json();
    const store = await getStore();
    const coupon = store.coupons.find((item) => item.id === id);
    if (!coupon) return createError(404, "Coupon not found");
    Object.assign(coupon, body);
    await writeStore(store);
    return createResponse(coupon);
  }

  if (pathname.startsWith("/api/admin/coupons/") && request.method === "DELETE") {
    const id = pathname.split("/").pop();
    const store = await getStore();
    const position = store.coupons.findIndex((item) => item.id === id);
    if (position === -1) return createError(404, "Coupon not found");
    const [deleted] = store.coupons.splice(position, 1);
    await writeStore(store);
    return createResponse(deleted);
  }

  if (pathname === "/api/admin/keys" && request.method === "GET") {
    const store = await getStore();
    return createResponse(store.keys);
  }

  if (pathname === "/api/admin/keys" && request.method === "POST") {
    const body = await request.json();
    const store = await getStore();
    const key = { id: createId("key"), ...body };
    store.keys.push(key);
    await writeStore(store);
    return createResponse(key);
  }

  if (pathname.startsWith("/api/admin/keys/") && request.method === "PUT") {
    const id = pathname.split("/").pop();
    const body = await request.json();
    const store = await getStore();
    const key = store.keys.find((item) => item.id === id);
    if (!key) return createError(404, "Key not found");
    Object.assign(key, body);
    await writeStore(store);
    return createResponse(key);
  }

  if (pathname.startsWith("/api/admin/keys/") && request.method === "DELETE") {
    const id = pathname.split("/").pop();
    const store = await getStore();
    const position = store.keys.findIndex((item) => item.id === id);
    if (position === -1) return createError(404, "Key not found");
    const [deleted] = store.keys.splice(position, 1);
    await writeStore(store);
    return createResponse(deleted);
  }

  // --- Banners: proxy to backend ---
  if (pathname === "/api/admin/banners" && request.method === "GET") {
    const session = getAdminSession(request);
    if (session?.backendCookieHeader) {
      return proxyToBackend(`/api/admin/banners`, "GET", session.backendCookieHeader);
    }
    const store = await getStore();
    return createResponse(store.banners);
  }

  if (pathname === "/api/admin/banners" && request.method === "POST") {
    const session = getAdminSession(request);
    const body = await request.json();
    if (session?.backendCookieHeader) {
      const response = await proxyToBackend(`/api/admin/banners`, "POST", session.backendCookieHeader, body);
      sendStoreUpdate({ type: "banners", action: "create" });
      return response;
    }
    const store = await getStore();
    const banner = { id: createId("banner"), ...body };
    store.banners.push(banner);
    await writeStore(store);
    sendStoreUpdate({ type: "banners", action: "create" });
    return createResponse(banner);
  }

  if (pathname.startsWith("/api/admin/banners/") && request.method === "PUT") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    const body = await request.json();
    if (session?.backendCookieHeader) {
      const response = await proxyToBackend(`/api/admin/banners/${id}`, "PUT", session.backendCookieHeader, body);
      sendStoreUpdate({ type: "banners", action: "update", id: String(id) });
      return response;
    }
    const store = await getStore();
    const banner = store.banners.find((item) => item.id === id);
    if (!banner) return createError(404, "Banner not found");
    Object.assign(banner, body);
    await writeStore(store);
    sendStoreUpdate({ type: "banners", action: "update", id: String(id) });
    return createResponse(banner);
  }

  if (pathname.startsWith("/api/admin/banners/") && request.method === "DELETE") {
    const id = pathname.split("/").pop();
    const session = getAdminSession(request);
    if (session?.backendCookieHeader) {
      const response = await proxyToBackend(`/api/admin/banners/${id}`, "DELETE", session.backendCookieHeader);
      sendStoreUpdate({ type: "banners", action: "delete", id: String(id) });
      return response;
    }
    const store = await getStore();
    const position = store.banners.findIndex((item) => item.id === id);
    if (position === -1) return createError(404, "Banner not found");
    const [deleted] = store.banners.splice(position, 1);
    await writeStore(store);
    sendStoreUpdate({ type: "banners", action: "delete", id: String(id) });
    return createResponse(deleted);
  }

  if (pathname === "/api/admin/notifications/stream" && request.method === "GET") {
    let send: ((event: string) => void) | undefined;
    const stream = new ReadableStream({
      start(controller) {
        send = (event: string) => {
          controller.enqueue(`data: ${event}\n\n`);
        };
        notificationSubscribers.add(send);
        controller.enqueue("retry: 5000\n\n");
      },
      cancel() {
        if (send) {
          notificationSubscribers.delete(send);
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  if (pathname === "/api/store/stream" && request.method === "GET") {
    let send: ((event: string) => void) | undefined;
    const stream = new ReadableStream({
      start(controller) {
        send = (event: string) => {
          controller.enqueue(`data: ${event}\n\n`);
        };
        storeUpdateSubscribers.add(send);
        controller.enqueue("retry: 5000\n\n");
      },
      cancel() {
        if (send) {
          storeUpdateSubscribers.delete(send);
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  return createError(404, "Admin endpoint not found");
}

export async function handlePublicApi(request: Request) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  if (pathname === "/api/products/featured" && request.method === "GET") {
    const store = await getStore();
    const featured = [...store.products]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0))
      .slice(0, 8);
    return createResponse(featured);
  }

  if (pathname.startsWith("/api/products/id/") && request.method === "GET") {
    const id = pathname.split("/").pop();
    const store = await getStore();
    const product = store.products.find((item) => item.id === id);
    if (!product) return createError(404, "Product not found");
    return createResponse({
      ...product,
      image: toPublicAssetPath(product.image),
      thumbnailUrl: toPublicAssetPath((product as { thumbnailUrl?: string }).thumbnailUrl),
    });
  }

  if (pathname === "/api/products" && request.method === "GET") {
    const store = await getStore();
    const category = searchParams.get("category");
    const categoryId = searchParams.get("categoryId");
    const query =
      searchParams.get("q")?.toLowerCase() ?? searchParams.get("keyword")?.toLowerCase() ?? "";
    const pageSizeRaw = Number(searchParams.get("pageSize") ?? 0);
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 0;
    let products = store.products;
    if (category) {
      products = products.filter((item) => item.category === category);
    }
    if (categoryId) {
      const selected = store.categories.find((item) => item.id === categoryId);
      if (selected) {
        products = products.filter((item) => item.category === selected.slug);
      }
    }
    if (query) {
      products = products.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      );
    }
    if (pageSize > 0) {
      products = products.slice(0, pageSize);
    }
    return createResponse(
      products.map((item) => ({
        ...item,
        image: toPublicAssetPath(item.image),
        thumbnailUrl: toPublicAssetPath((item as { thumbnailUrl?: string }).thumbnailUrl),
      })),
    );
  }

  if (pathname.startsWith("/api/products/") && request.method === "GET") {
    const slug = pathname.split("/").pop();
    const store = await getStore();
    const product = store.products.find((item) => item.slug === slug);
    if (!product) return createError(404, "Product not found");
    return createResponse({
      ...product,
      image: toPublicAssetPath(product.image),
      thumbnailUrl: toPublicAssetPath((product as { thumbnailUrl?: string }).thumbnailUrl),
    });
  }

  if (pathname === "/api/categories" && request.method === "GET") {
    const store = await getStore();
    return createResponse(store.categories);
  }

  if (pathname.startsWith("/api/categories/") && request.method === "GET") {
    const slug = pathname.split("/").pop();
    const store = await getStore();
    const category = store.categories.find((item) => item.slug === slug);
    if (!category) return createError(404, "Category not found");
    return createResponse(category);
  }

  if (pathname === "/api/brands" && request.method === "GET") {
    const store = await getStore();
    const fromStore = store.brands ?? [];
    if (fromStore.length > 0) {
      return createResponse(fromStore);
    }

    // Backfill brands from products so storefront still renders when brands list is empty.
    const derived = Array.from(new Set(store.products.map((item) => item.brand).filter(Boolean))).map(
      (name) => ({
        id: createId("brand"),
        name,
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
      }),
    );

    return createResponse(derived);
  }

  if (pathname === "/api/banners" && request.method === "GET") {
    const store = await getStore();
    const banners = (store.banners ?? [])
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: toPublicAssetPath(item.image),
      }));
    return createResponse(banners);
  }

  if (pathname === "/api/search" && request.method === "GET") {
    const query = searchParams.get("q")?.toLowerCase() ?? "";
    const store = await getStore();
    const results = query
      ? store.products.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.brand.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query),
        )
      : [];
    return createResponse(results);
  }

  if (pathname === "/api/orders" && request.method === "POST") {
    const body = await request.json();
    const { items, email, phone, note, deliveryMethod, couponCode } = body;
    if (!items || !Array.isArray(items) || !email || !phone) {
      return createError(400, "Missing order information");
    }
    const store = await getStore();
    const total = items.reduce(
      (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
      0,
    );
    const order = {
      id: createId("order"),
      email,
      phone,
      note: note || "",
      deliveryMethod: deliveryMethod || "email",
      couponCode,
      total,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      items,
    };
    store.orders.push(order);
    const productNames = items
      .map((item: { name?: string }) => item.name)
      .filter(Boolean)
      .join(", ");
    const notificationMessage = productNames
      ? `Đơn hàng mới: ${productNames}`
      : `Đơn hàng mới ${order.id}`;
    const notification = {
      id: createId("notify"),
      message: notificationMessage,
      type: "order" as const,
      orderId: order.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    store.notifications.push(notification);
    await writeStore(store);
    sendNotificationObj(notification);
    return createResponse({ orderId: order.id });
  }

  return createError(404, "Public endpoint not found");
}
