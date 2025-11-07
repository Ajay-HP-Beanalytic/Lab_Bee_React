/**
 * Reusable utility functions for creating docx elements
 */

import {
  AlignmentType,
  Paragraph,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  VerticalAlign,
  Table,
  BorderStyle,
  ImageRun,
} from "docx";

/**
 * Creates a TextRun with default styling
 * @param {string} text - Text content
 * @param {object} options - Styling options
 * @param {boolean} options.bold - Bold text
 * @param {number} options.size - Font size (default 20)
 * @param {string} options.font - Font family (default "Calibri(Body)")
 * @param {string} options.color - Text color (default "000000")
 * @returns {TextRun}
 */
export const createTextRun = (text, options = {}) => {
  return new TextRun({
    text: text || "",
    bold: options.bold || false,
    size: options.size || 20,
    font: options.font || "Calibri(Body)",
    color: options.color || "000000",
  });
};

/**
 * Creates a Paragraph for captions with default styling
 * @param {String} text - Caption text
 * @param {Object} options - Styling Options
 * @param {boolean} options.bold - Bold text (default true)
 * @param {number} options.size - Font size (default 18)
 * @param {string} options.font - Font family
 * @param {string} options.color - Text color
 * @param {AlignmentType} options.alignment - Paragraph alignment (default LEFT)
 * @param {number} options.before - Spacing before (default 100)
 * @param {number} options.after - Spacing after (default 100)
 * @returns {Paragraph}
 */
export const createCaptionParagraph = (text, options = {}) => {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: {
      before: options.before || 100,
      after: options.after || 100,
    },
    children: [
      new TextRun({
        text: text || "",
        bold: options.bold !== undefined ? options.bold : true,
        size: options.size || 18,
        font: options.font || "Calibri(Body)",
        color: options.color || "000000",
      }),
    ],
  });
};

/**
 * Creates a paragraph with text runs
 * @param {string|string[]} text - Text content (string or array of strings)
 * @param {object} options - Paragraph options
 * @param {string} options.alignment - Alignment (LEFT, CENTER, RIGHT)
 * @param {boolean} options.bold - Bold text
 * @param {number} options.size - Font size
 * @param {object} options.spacing - Spacing configuration
 * @returns {Paragraph}
 */
export const createParagraph = (text, options = {}) => {
  const texts = Array.isArray(text) ? text : [text];

  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: options.spacing || {},
    children: texts.map((t) =>
      createTextRun(t, {
        bold: options.bold,
        size: options.size,
        font: options.font,
        color: options.color,
      })
    ),
  });
};

/**
 * Creates a table cell with common styling
 * @param {string|Paragraph[]} content - Cell content (string or array of Paragraphs)
 * @param {object} options - Cell options
 * @param {number} options.width - Width percentage (1-100)
 * @param {string} options.alignment - Text alignment
 * @param {string} options.verticalAlign - Vertical alignment
 * @param {boolean} options.bold - Bold text
 * @param {number} options.size - Font size
 * @param {string} options.shading - Background color (hex)
 * @param {number} options.rowSpan - Row span
 * @param {object} options.margins - Cell margins
 * @returns {TableCell}
 */
export const createTableCell = (content, options = {}) => {
  const cellConfig = {
    verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
  };

  // Add width if specified
  if (options.width) {
    cellConfig.width = {
      size: options.width,
      type: WidthType.PERCENTAGE,
    };
  }

  // Add margins (default to 20 top/bottom)
  cellConfig.margins = options.margins || {
    top: 20,
    bottom: 20,
  };

  // Add shading if specified
  if (options.shading) {
    cellConfig.shading = {
      fill: options.shading,
    };
  }

  // Add rowSpan if specified
  if (options.rowSpan) {
    cellConfig.rowSpan = options.rowSpan;
  }

  // Create children based on content type
  if (typeof content === "string") {
    cellConfig.children = [
      createParagraph(content, {
        alignment: options.alignment || AlignmentType.LEFT,
        bold: options.bold,
        size: options.size,
        font: options.font,
        color: options.color,
      }),
    ];
  } else if (Array.isArray(content)) {
    cellConfig.children = content;
  } else {
    cellConfig.children = [content];
  }

  return new TableCell(cellConfig);
};

/**
 * Creates a header cell with standard styling
 * @param {string} text - Header text
 * @param {object} options - Additional options
 * @param {number} options.width - Width percentage
 * @returns {TableCell}
 */
export const createHeaderCell = (text, options = {}) => {
  return createTableCell(text, {
    ...options,
    alignment: AlignmentType.CENTER,
    bold: true,
    shading: "D9D9D9", // Light gray background
  });
};

/**
 * Creates a data cell with standard styling
 * @param {string} text - Cell text
 * @param {object} options - Additional options
 * @param {number} options.width - Width percentage
 * @param {string} options.alignment - Text alignment (defaults to LEFT)
 * @returns {TableCell}
 */
export const createDataCell = (text, options = {}) => {
  return createTableCell(text || "N/A", {
    ...options,
    alignment: options.alignment || AlignmentType.LEFT,
    textWrapping: true,
  });
};

/**
 * Creates a centered data cell
 * @param {string} text - Cell text
 * @param {object} options - Additional options
 * @returns {TableCell}
 */
export const createCenteredDataCell = (text, options = {}) => {
  return createDataCell(text, {
    ...options,
    alignment: AlignmentType.CENTER,
  });
};

/**
 * Normalize cell value to string
 * @param {any} value - Value to normalize
 * @returns {string}
 */
export const normalizeValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  return String(value);
};

/**
 * Create a multi-column data table with borders
 * @param {Array} rows - Array of TableRow objects (column headers and data rows)
 * @param {Object} options - Table customization options
 * @param {number} options.width - Table width percentage (default 100)
 * @param {Object} options.borders - Custom border configuration
 * @returns {Table} - docx Table object
 */
export const createDataTable = (rows, options = {}) => {
  return new Table({
    width: {
      size: options.width || 100,
      type: WidthType.PERCENTAGE,
    },
    borders: options.borders || {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: rows,
  });
};

/**
 * Creates a Paragraph for table headings with default styling
 * @param {string} text - Heading text
 * @param {Object} options - Styling options
 * @param {string} options.heading - Heading level (default "Heading2")
 * @param {number} options.before - Spacing before (default 400)
 * @param {number} options.after - Spacing after (default 100)
 * @param {AlignmentType} options.alignment - Text alignment (default CENTER)
 * @returns {Paragraph}
 */
export const createTableHeadingParagraph = (text, options = {}) => {
  return new Paragraph({
    text: text,
    heading: options.heading || "Heading2",
    spacing: {
      before: options.before || 400,
      after: options.after || 100,
    },
    alignment: options.alignment || AlignmentType.CENTER,
  });
};

/**
 * Creates a Paragraph for table headings with default styling
 * @param {string} text - Heading text
 * @param {Object} options - Styling options
 * @param {string} options.heading - Heading level (default "Heading1")
 * @param {number} options.before - Spacing before (default 100)
 * @param {number} options.after - Spacing after (default 100)
 * @param {AlignmentType} options.alignment - Text alignment (default CENTER)
 * @returns {Paragraph}
 */
export const createHeadingParagraph = (text, options = {}) => {
  return new Paragraph({
    text: text,
    heading: options.heading || "Heading2",
    spacing: {
      before: options.before || 400,
      after: options.after || 100,
    },
    alignment: options.alignment || AlignmentType.CENTER,
  });
};

/**
 * Creates a single image paragraph
 * @param {string} base64Data - Base64 image data
 * @param {Object} options - Image options
 * @param {number} options.width - Image width in pixels (default 500)
 * @param {number} options.height - Image height in pixels (default 350)
 * @param {string} options.caption - Image caption text
 * @param {AlignmentType} options.alignment - Image alignment (default CENTER)
 * @returns {Array} Array of Paragraphs (image + optional caption)
 */
export const createImageParagraph = (base64Data, options = {}) => {
  const elements = [];

  // Add image paragraph
  elements.push(
    new Paragraph({
      alignment: options.alignment || AlignmentType.CENTER,
      spacing: {
        before: options.spacingBefore || 200,
        after: options.caption ? 50 : 200,
      },
      children: [
        new ImageRun({
          data: base64Data,
          transformation: {
            width: options.width || 500,
            height: options.height || 350,
          },
        }),
      ],
    })
  );

  // Add caption if provided
  if (options.caption) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 50,
          after: 200,
        },
        children: [
          new TextRun({
            text: options.caption,
            size: 18,
            font: "Calibri(Body)",
            color: "000000",
            italics: true,
          }),
        ],
      })
    );
  }

  return elements;
};

/**
 * Creates multiple image paragraphs from an array of base64 images
 * @param {Array<string>} imagesBase64 - Array of base64 image data
 * @param {Object} options - Image options
 * @param {number} options.width - Image width in pixels (default 500)
 * @param {number} options.height - Image height in pixels (default 350)
 * @param {string} options.captionPrefix - Caption prefix (e.g., "Figure")
 * @param {Function} options.captionFormatter - Custom caption formatter function(index, total)
 * @param {AlignmentType} options.alignment - Image alignment (default CENTER)
 * @param {number} options.imagesPerRow - Number of images per row for grid layout (default 1 - vertical)
 * @returns {Array} Array of all image and caption Paragraphs
 */
export const createMultipleImageParagraphs = (imagesBase64, options = {}) => {
  if (!imagesBase64 || imagesBase64.length === 0) {
    return [];
  }

  const imagesPerRow = options.imagesPerRow || 1;

  // If imagesPerRow > 1, use grid layout
  if (imagesPerRow > 1) {
    return createImageGrid(imagesBase64, options);
  }

  // Otherwise, use vertical layout (original behavior)
  const elements = [];

  imagesBase64.forEach((base64Data, index) => {
    let caption = null;

    // Generate caption if formatter or prefix provided
    if (options.captionFormatter) {
      caption = options.captionFormatter(index + 1, imagesBase64.length);
    } else if (options.captionPrefix) {
      caption = `${options.captionPrefix} ${index + 1}`;
    }

    // Add image and caption
    elements.push(
      ...createImageParagraph(base64Data, {
        ...options,
        caption,
      })
    );
  });

  return elements;
};

/**
 * Creates a grid layout for images (side-by-side)
 * @param {Array<string>} imagesBase64 - Array of base64 image data
 * @param {Object} options - Image options
 * @param {number} options.imagesPerRow - Number of images per row (default 2)
 * @param {number} options.width - Image width in pixels (default 250)
 * @param {number} options.height - Image height in pixels (default 200)
 * @param {string} options.captionPrefix - Caption prefix (e.g., "Figure")
 * @param {Function} options.captionFormatter - Custom caption formatter function(index, total)
 * @returns {Array} Array containing table(s) with images in grid layout
 */
export const createImageGrid = (imagesBase64, options = {}) => {
  if (!imagesBase64 || imagesBase64.length === 0) {
    return [];
  }

  const imagesPerRow = options.imagesPerRow || 2;
  const imageWidth = options.width || 250;
  const imageHeight = options.height || 200;
  const cellWidthPercent = Math.floor(100 / imagesPerRow);

  const elements = [];
  const rows = [];

  // Group images into rows
  for (let i = 0; i < imagesBase64.length; i += imagesPerRow) {
    const rowImages = imagesBase64.slice(i, i + imagesPerRow);
    const rowCells = [];

    rowImages.forEach((base64Data, indexInRow) => {
      const globalIndex = i + indexInRow;
      let caption = null;

      // Generate caption
      if (options.captionFormatter) {
        caption = options.captionFormatter(globalIndex + 1, imagesBase64.length);
      } else if (options.captionPrefix) {
        caption = `${options.captionPrefix} ${globalIndex + 1}`;
      }

      // Create cell with image and caption
      const cellChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 50 },
          children: [
            new ImageRun({
              data: base64Data,
              transformation: {
                width: imageWidth,
                height: imageHeight,
              },
            }),
          ],
        }),
      ];

      // Add caption if exists
      if (caption) {
        cellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 50, after: 100 },
            children: [
              new TextRun({
                text: caption,
                size: 18,
                font: "Calibri(Body)",
                color: "000000",
                italics: true,
              }),
            ],
          })
        );
      }

      rowCells.push(
        new TableCell({
          width: { size: cellWidthPercent, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          children: cellChildren,
        })
      );
    });

    // Add empty cells if row is incomplete
    while (rowCells.length < imagesPerRow) {
      rowCells.push(
        new TableCell({
          width: { size: cellWidthPercent, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: "" })],
        })
      );
    }

    rows.push(new TableRow({ children: rowCells }));
  }

  // Create table with all rows
  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: rows,
    })
  );

  return elements;
};
