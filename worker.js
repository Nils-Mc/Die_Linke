export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API endpoints
    if (path.startsWith("/api/")) {
      let buttons = await env.BUTTONS.get("buttons", { type: "json" }) || [];

      if (path === "/api/buttons") {
        return Response.json(buttons);
      }

      if (path === "/api/add" && request.method === "POST") {
        const body = await request.json();
        const newButton = { id: crypto.randomUUID(), ...body };
        buttons.push(newButton);
        await env.BUTTONS.put("buttons", JSON.stringify(buttons));
        return Response.json(newButton);
      }

      if (path === "/api/edit" && request.method === "POST") {
        const body = await request.json();
        const idx = buttons.findIndex(b => b.id === body.id);
        if (idx !== -1) {
          buttons[idx] = body;
          await env.BUTTONS.put("buttons", JSON.stringify(buttons));
        }
        return Response.json(body);
      }

      if (path === "/api/delete" && request.method === "POST") {
        const body = await request.json();
        buttons = buttons.filter(b => b.id !== body.id);
        await env.BUTTONS.put("buttons", JSON.stringify(buttons));
        return new Response("Deleted", { status: 200 });
      }

      return new Response("API endpoint not found", { status: 404 });
    }

    // Index mit Buttons rendern
    if (path === "/" || path === "/index.html") {
      const indexFile = await env.ASSETS.fetch("index.html");
      let html = await indexFile.text();
      const buttons = await env.BUTTONS.get("buttons", { type: "json" }) || [];
      const buttonsHtml = buttons
        .map(b => `<a href="${b.url}"><button>${b.label}</button></a>`)
        .join("\n");
      html = html.replace("{{buttons}}", buttonsHtml);
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // Alles andere statisch ausliefern
    return env.ASSETS.fetch(request);
  }
};
