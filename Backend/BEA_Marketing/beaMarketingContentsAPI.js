const { db } = require("../db");
require("dotenv").config();

const beaMarketingContentAPIs = ({ app, io, labbeeUsers }) => {
  //POST route
  app.post("/api/postTopic", async (req, res) => {
    const { data } = req.body;
    console.log("data in marketing page-->", data);

    const { generateAllContent } = await import("./agentOrchestrator.mjs");
    const result = await generateAllContent(data);
    res.status(200).json(result);
  });

  //GET route
  app.get("/api/getAIResponse", async (req, res) => {});
};

module.exports = { beaMarketingContentAPIs };
