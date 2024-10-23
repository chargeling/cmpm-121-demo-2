import "./style.css";

const APP_NAME = "Brainstorming Board";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawingCanvas";
app.appendChild(canvas);

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
app.appendChild(thickButton);

const ctx = canvas.getContext("2d")!;
let drawing = false;
let lines: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];
let currentThickness = 1;
let toolPreview: ToolPreview | null = null;

class MarkerLine {
    private points: { x: number, y: number }[] = [];
    private thickness: number;
  
    constructor(initialX: number, initialY: number, thickness: number) {
      this.points.push({ x: initialX, y: initialY });
      this.thickness = thickness;
    }
  
    drag(x: number, y: number) {
      this.points.push({ x, y });
    }
  
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

class ToolPreview {
    private x: number;
    private y: number;
    private thickness: number;
  
    constructor(x: number, y: number, thickness: number) {
      this.x = x;
      this.y = y;
      this.thickness = thickness;
    }
  
    updatePosition(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  
    display(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
}

canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const line = new MarkerLine(x, y, currentThickness);
  lines.push(line);
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  
    if (drawing) {
      lines[lines.length - 1].drag(x, y);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
      if (!toolPreview) {
        toolPreview = new ToolPreview(x, y, currentThickness);
      } else {
        toolPreview.updatePosition(x, y);
      }
      canvas.dispatchEvent(new Event("tool-moved"));
    }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

clearButton.addEventListener("click", () => {
    lines = [];
    redoStack = [];
    canvas.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
      const lastLine = lines.pop();
      redoStack.push(lastLine!);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
});
  
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
      const lastLine = redoStack.pop();
      lines.push(lastLine!);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

thinButton.addEventListener("click", () => {
    currentThickness = 1;
    thinButton.classList.add("selectedTool");
    thickButton.classList.remove("selectedTool");
});
  
thickButton.addEventListener("click", () => {
    currentThickness = 5;
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => line.display(ctx));
});

canvas.addEventListener("tool-moved", () => {
    if (!drawing && toolPreview) {
      toolPreview.display(ctx);
    }
});