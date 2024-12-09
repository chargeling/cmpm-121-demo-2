import "./style.css";

// Constants
const APP_NAME = "Brainstorming Board";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Set the document title and initial content
document.title = APP_NAME;
app.innerHTML = APP_NAME;

// Create and append the title element
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Create and append the canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawingCanvas";
app.appendChild(canvas);

// Create and append the Clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Create and append the Undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

// Create and append the Redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

// Create and append the Thin marker button
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
app.appendChild(thinButton);

// Create and append the Thick marker button
const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
app.appendChild(thickButton);

// Create and append the Custom Sticker button
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Add Custom Sticker";
app.appendChild(customStickerButton);

// Create and append the Export button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
app.appendChild(exportButton);

// Initial set of stickers (emojis)
const stickers = [
  { content: "😤", button: null },
  { content: "🥶", button: null },
  { content: "🏹", button: null },
  { content: "👊", button: null },
  { content: "✌️", button: null },
];

// Canvas context for drawing
const ctx = canvas.getContext("2d")!;

// State variables
let drawing = false; // Indicates if the user is currently drawing
let lines: MarkerLine[] = []; // List of drawn lines
let redoStack: MarkerLine[] = []; // Stack for redo functionality
let currentThickness = 1; // Current thickness of the marker
let toolPreview: ToolPreview | StickerPreview | null = null; // Preview of the current tool
let currentSticker: string | null = null; // Current selected sticker

// Class representing a marker line
class MarkerLine {
  private points: { x: number, y: number }[] = [];
  private thickness: number;

  constructor(initialX: number, initialY: number, thickness: number) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
  }

  // Method to add a point to the line
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Method to display the line on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = this.thickness;
    this.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }
}

// Class representing a tool preview
class ToolPreview {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  // Method to update the position of the preview
  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Method to display the preview on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Class representing a sticker
class Sticker {
  private x: number;
  private y: number;
  private content: string;

  constructor(x: number, y: number, content: string) {
    this.x = x;
    this.y = y;
    this.content = content;
  }

  // Method to update the position of the sticker
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Method to display the sticker on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px Arial";
    ctx.fillText(this.content, this.x, this.y);
  }
}

// Class representing a sticker preview
class StickerPreview {
  private x: number;
  private y: number;
  private content: string;

  constructor(x: number, y: number, content: string) {
    this.x = x;
    this.y = y;
    this.content = content;
  }

  // Method to update the position of the preview
  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Method to display the preview on the canvas
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px Arial";
    ctx.fillText(this.content, this.x, this.y);
  }
}

// Function to create a button for each sticker
function createStickerButton(sticker) {
  const button = document.createElement("button");
  button.textContent = sticker.content;
  button.addEventListener("click", () => {
    currentSticker = sticker.content;
    stickers.forEach(s => s.button.classList.remove("selectedTool"));
    button.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    canvas.dispatchEvent(new Event("tool-moved"));
  });
  app.appendChild(button);
  sticker.button = button;
}

// Create buttons for each initial sticker
stickers.forEach(createStickerButton);

// Event listener for adding a custom sticker
customStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter custom sticker:", "😊");
  if (customSticker) {
    const newSticker = { content: customSticker, button: null };
    stickers.push(newSticker);
    createStickerButton(newSticker);
  }
});

// Event listener for mouse down on the canvas
canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (currentSticker) {
    const sticker = new Sticker(x, y, currentSticker);
    lines.push(sticker as unknown as MarkerLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    drawing = true;
    const line = new MarkerLine(x, y, currentThickness);
    lines.push(line);
    ctx.beginPath();
  }
});

// Event listener for mouse move on the canvas
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (drawing) {
    lines[lines.length - 1].drag(x, y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    if (currentSticker) {
      if (!toolPreview || !(toolPreview instanceof StickerPreview)) {
        toolPreview = new StickerPreview(x, y, currentSticker);
      } else {
        toolPreview.updatePosition(x, y);
      }
    } else {
      if (!toolPreview || !(toolPreview instanceof ToolPreview)) {
        toolPreview = new ToolPreview(x, y, currentThickness);
      } else {
        toolPreview.updatePosition(x, y);
      }
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

// Event listener for mouse up on the canvas
canvas.addEventListener("mouseup", () => {
  drawing = false;
});

// Event listener for the Clear button
clearButton.addEventListener("click", () => {
  lines = [];
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Event listener for the Undo button
undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const lastLine = lines.pop();
    redoStack.push(lastLine!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Event listener for the Redo button
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastLine = redoStack.pop();
    lines.push(lastLine!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Event listener for the Thin marker button
thinButton.addEventListener("click", () => {
  currentThickness = 2;
  currentSticker = null;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  stickers.forEach(s => s.button.classList.remove("selectedTool"));
});

// Event listener for the Thick marker button
thickButton.addEventListener("click", () => {
  currentThickness = 7;
  currentSticker = null;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  stickers.forEach(s => s.button.classList.remove("selectedTool"));
});

// Event listener for the Export button
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4);
  lines.forEach(line => line.display(exportCtx));
  const link = document.createElement("a");
  link.href = exportCanvas.toDataURL("image/png");
  link.download = "drawing.png";
  link.click();
});

// Event listener for drawing changes
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach(line => line.display(ctx));
});

// Event listener for tool movement
canvas.addEventListener("tool-moved", () => {
  if (!drawing && toolPreview) {
    toolPreview.display(ctx);
  }
});