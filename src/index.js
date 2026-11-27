export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/r2/")) {
      const key = url.pathname.slice(4); // 例如 /r2/hero.png -> hero.png
      const object = await env.ASSETS_BUCKET.get(key);
      if (!object) {
        return new Response("Asset not found", { status: 404 });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Access-Control-Allow-Origin", "*");
      return new Response(object.body, { headers });
    }

    return env.ASSETS.fetch(request);
  }
};
