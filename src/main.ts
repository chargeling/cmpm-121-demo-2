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

const ctx = canvas.getContext("2d")!;
let drawing = false;
let lines: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];

class MarkerLine {
    private points: { x: number, y: number }[] = [];
  
    constructor(initialX: number, initialY: number) {
      this.points.push({ x: initialX, y: initialY });
    }
  
    drag(x: number, y: number) {
      this.points.push({ x, y });
    }
  
    display(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
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

canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const line = new MarkerLine(x, y);
  lines.push(line);
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  lines[lines.length - 1].drag(x, y);
  canvas.dispatchEvent(new Event("drawing-changed"));
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

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => line.display(ctx));
});