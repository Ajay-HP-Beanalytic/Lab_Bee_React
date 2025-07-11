const OpenAI = require("openai");
require("dotenv").config();

function openaiAPIs(app, io, labbeeUsers) {
  // Initialize OpenAI client

  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
  });

  //   console.log("openai", openai);

  //   const completion = openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     store: true,
  //     messages: [
  //       {
  //         role: "user",
  //         content:
  //           "write a poem in Kannada language on the topic 'AI' in 50 words",
  //       },
  //     ],
  //   });

  //   completion.then((result) => console.log(result.choices[0].message));
}

module.exports = { openaiAPIs };
