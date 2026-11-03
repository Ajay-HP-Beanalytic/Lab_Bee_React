const library = require("./standardsLibrary");
const { canManageFiles } = require("../../fileStorageAPIs");

const fail = (status, message) => Object.assign(new Error(message), { status });

// Standards library: the register of standard PDFs kept in Org Documents → Standards,
// and search in their text
const standardsAPIs = (app) => {
  const handle = (action, { manage = false } = {}) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    if (manage && !canManageFiles(req.session)) return res.status(403).json({ error: "Only Administration and the Quality Engineer can change the standards register" });
    try {
      res.json(await action(req, userId));
    } catch (err) {
      if (!err.status) console.error("Standards API error:", err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong" });
    }
  };

  app.get("/api/standards", handle(async (req) => ({
    standards: await library.list(),
    families: library.FAMILY_NAMES,
    folder: library.ROOT,
    canManage: canManageFiles(req.session),
  })));

  // ?q=Method 514.6 [&standard_id=3]
  app.get("/api/standards/search", handle(async (req) => {
    const standardId = req.query.standard_id ? Number(req.query.standard_id) : null;
    return { hits: await library.search(req.query.q, { standardId }) };
  }));

  app.get("/api/standards/:id/pages/:page", handle((req) => library.pageText(Number(req.params.id), Number(req.params.page))));

  app.patch("/api/standards/:id", handle((req, userId) => library.update(Number(req.params.id), req.body || {}, userId), { manage: true }));

  // Read the PDF's text again (e.g. after it was replaced, or reading failed)
  app.post("/api/standards/:id/read", handle(async (req) => {
    const id = Number(req.params.id);
    if (!id) throw fail(400, "Invalid id");
    await library.reread(id);
    return { ok: true };
  }, { manage: true }));
};

module.exports = { standardsAPIs };
