(async () => {
  try {
    const base = "http://localhost:8081";
    const loginResp = await fetch(base + "/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@namnguyen.local", password: "Admin@123" }),
    });
    const loginText = await loginResp.text();
    console.log("LOGIN status", loginResp.status);
    console.log("LOGIN body:", loginText);

    const setCookie =
      loginResp.headers.get("set-cookie") || loginResp.headers.get("Set-Cookie") || "";
    const cookie = setCookie.split(";")[0];
    // Use cookie if available
    const dashResp = await fetch(base + "/api/admin/dashboard", {
      headers: cookie ? { cookie } : {},
    });
    console.log("DASHBOARD status", dashResp.status);
    if (dashResp.headers.get("content-type")?.includes("application/json")) {
      console.log("DASHBOARD body:", await dashResp.json());
    } else {
      console.log("DASHBOARD text:", await dashResp.text());
    }

    const productsResp = await fetch(base + "/api/products", { headers: cookie ? { cookie } : {} });
    const products = await productsResp.json();
    console.log(
      "PRODUCTS_COUNT:",
      Array.isArray(products) ? products.length : JSON.stringify(products).slice(0, 200),
    );

    const categoriesResp = await fetch(base + "/api/categories", {
      headers: cookie ? { cookie } : {},
    });
    const categories = await categoriesResp.json();
    console.log(
      "CATEGORIES_COUNT:",
      Array.isArray(categories) ? categories.length : JSON.stringify(categories).slice(0, 200),
    );
  } catch (err) {
    console.error("ERROR", err);
    process.exit(1);
  }
})();
