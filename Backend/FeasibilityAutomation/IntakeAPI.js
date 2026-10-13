const { sendToAi, markManual } = require("./intake/confidentialHandling");

//API endpoints of the email intake (all require a logged-in user).
const intakeAPIs = (app) => {
  const handle = (action) => async (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const requestId = parseInt(req.params.id);
    if (!requestId) return res.status(400).json({ error: "Invalid request id" });

    try {
      const result = await action(requestId, userId);
      res.json({ success: true, ...result });
    } catch (err) {
      if (!err.status) console.error("Confidential handling error:", err);
      res.status(err.status || 500).json({ error: err.message });
    }
  };

  // Staff approve sending a confidential request's email(s) to the AI
  app.post("/api/feasibility/requests/:id/send-to-ai", handle(sendToAi));

  // Staff choose to enter a confidential request's details manually
  app.post("/api/feasibility/requests/:id/handle-manually", handle(markManual));
};

module.exports = { intakeAPIs };
