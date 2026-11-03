// Reads the text of one PDF, page by page, in a separate process (started by
// standardsLibrary with child_process.fork): a large standard takes a while and
// a crash in the PDF library must not take the server down.
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

(async () => {
  const parser = new PDFParse({ data: fs.readFileSync(process.argv[2]) });
  try {
    const result = await parser.getText();
    process.send({ pages: result.pages.map((p) => ({ no: p.num, text: p.text })) });
  } finally {
    await parser.destroy();
  }
})()
  .catch((err) => process.send({ error: err.message }))
  .finally(() => process.disconnect());
