# Viewport Study

Looking at the user's screenshot, this perfectly aligns with what we've already built in concept, but there's a vital difference in *how* they interact structurally.

In our current implementation (just added):
- You drag the bottom-right corner of Box A arbitrarily (changing its width and height independently).
- When you do, we figure out its new aspect ratio `(h/w)`.
- We then FORCE Box B to mathematically change its height so that `BoxB(h/w) = 16/9 - BoxA(h/w)`.
- We update the `splitRatio`.

In the screenshot provided (which looks like Streamlabs/CrossClip):
1. **The Aspect Ratios of the boxes are strictly locked**. You can see the drag handles on the corners. When you grab a corner of Box A, it scales **proportionally** (locked aspect ratio).
2. **The "Split Ratio" is defined strictly by the divider between the two boxes in the Vertical Preview panel (on the right)**.
   - You can see a pill-shaped drag handle `[ : : : : ]` sitting horizontally between the Top (Facecam) and Bottom (Gameplay) in the Portrait Version side-panel.
   - When you drag that handle up or down, it changes the vertical split between the two sections.
3. Therefore:
   - Box A's aspect ratio on the source video is ALWAYS entirely dependent on the Split Ratio in the preview column.
   - Box B's aspect ratio on the source video is ALWAYS entirely dependent on the Split Ratio in the preview column.
   - If I drag the divider in the Preview to 50/50, both Box A and Box B become exactly 1:1 square.
   - If I scale Box A, it scales as a Perfect Square.

This is a much better UX than letting the user arbitrarily distort Box A's aspect ratio and implicitly moving the split. 

## Plan Update to match screenshot:
1. **Source Boxes are Aspect-Ratio Locked**:
   - The two boxes on the Left (Landscape version) can only scale uniformly.
   - `topBox.w` changes, therefore `topBox.h = topBox.w * (16/9) * splitRatio`.
2. **Vertical Preview Split Divider**:
   - We ALREADY built the split divider. Wait, we built the split divider between the Source Panel and Preview Panel (Left-Right resizing).
   - The user screenshot shows the split divider inside the *Preview* panel, dividing the Top Camera and Bottom Camera vertically.
   - We need to add a horizontal drag handle inside `VerticalPreview` (or between the two canvases if we split them) to let the user change the `viewportSplitRatio`!
   - Wait, if `viewportSplitRatio` changes, the aspect ratios of the boxes change. This is exactly what the user wants.

So the UI is:
- **Left**: Video with two boxes. They are pink and cyan.
- **Right**: 9:16 Preview. There is a `[ : : : : ]` drag handle between the Top and Bottom windows. Dragging this updates `viewportSplitRatio` which instantly squashes/stretches the required aspect ratios of the Left boxes.
- On the Left, when you resize a box using its corner handle, it just scales Up/Down (locked aspect ratio).

Our current logic for resizing a box in `DualViewportOverlay`:
```javascript
      } else if (dragging === 'top-resize') {
        const newW = startBox.w + deltaX;
        const newH = startBox.h + deltaY;
        let newSplit = (newH / newW) / (16 / 9); // We are dynamically changing the split!
```
Instead, it should be:
```javascript
      } else if (dragging === 'top-resize') {
        // Uniform scaling based entirely on deltaX (or deltaY) using the fixed splitRatio
        const newW = Math.max(0.1, Math.min(1 - startBox.x, startBox.w + deltaX));
        const newH = newW * (16/9) * splitRatio; 
        onTopBoxChange({ ...topBox, w: newW, h: newH });
```
This is much simpler math.

And we need a horizontal draggable divider in the `VerticalPreview`.
Currently `VerticalPreview` draws everything onto one single `<canvas>`.
Instead of putting a divider on a canvas, we can overlay a custom DIV drag-handle over the canvas at `y = splitRatio * canvasHeight`.
When the user drags that handle vertically, they update the `viewportSplitRatio`.

Let's modify the `DualViewportOverlay` and `VerticalPreview` to perfectly match this.
