# Plan: Dual Free-Floating Viewports

Audio Analysis:
- User wants *two separate* scalable windows (a top one and a bottom one) for the mobile preview.
- They need to be able to be moved around the wide screen (not just locked to full width).
- They need to be scalable (resizable) and they should "react to each other's size".
- Aspect ratio of the combined result needs to be 9:16.
- The top and bottom viewports together form the 9:16 final vertical video.

Math/Constraints:
1. Final export video is 9:16 (e.g., 1080x1920).
2. The user has two "cameras" (crop zones) on the 16:9 source video.
3. Zone 1 (Top) has width W1, height H1.
4. Zone 2 (Bottom) has width W2, height H2.
5. In the final vertical video, Top takes up the top portion, Bottom takes up the bottom portion.
6. To make them stitch seamlessly into a 9:16 video:
   - Since they are stacked vertically, their export widths must match. Let's say we normalize both to the width of the final output canvas.
   - So the aspect ratio of (Top Zone) + (Bottom Zone) stacked must equal 9:16.
   - Wait, if they have different widths on the *source*, we have to scale them to match the same output width? Or do they just represent regions that get cropped, but maintaining the *same width* on the source?
   - Usually in these facecam/gameplay clips, the top crop (facecam) and bottom crop (gameplay) might not be the same width physically on the screen. However, when rendering they both scale to fill the width (e.g. 1080px wide).
   - If they both scale to fit width 1080px, then:
     - Top output height = (1080 / W1) * H1
     - Bottom output height = (1080 / W2) * H2
     - Total output height = Top output height + Bottom output height = 1920
     - So: \frac{1080 \cdot H_1}{W_1} + \frac{1080 \cdot H_2}{W_2} = 1920
     - Which simplifies to: \frac{H_1}{W_1} + \frac{H_2}{W_2} = \frac{1920}{1080} = \frac{16}{9}
   - That means the sum of their individual aspect ratios (H/W) must exactly equal 16/9.

Wait, the user says "I can only resize it at a fixed thing. it shouldn't be fixed. The aspect ratio in between the top and bottom should be fixed so it adjusts dynamically depending on each of the viewports that I size across the video... and then that is what gets rendered."

So the rule is:
1. Two draggable, resizable boxes on the source video.
2. Box A (Cam) and Box B (Gameplay).
3. If I resize Box A (change its width/height), Box B's forced aspect ratio (or size) adjusts so that \frac{H_a}{W_a} + \frac{H_b}{W_b} = \frac{16}{9} is always satisfied.
4. Actually, it's easier to force a relationship. Usually, users use fixed aspect ratio boxes? No, he says "the aspect ratio in between the top and bottom should be fixed so it adjusts dynamically". 

Let's rethink:
When adjusting Box A's height, if Box A width is fixed, its aspect ratio H_a / W_a changes.
Then Box B's required aspect ratio H_b / W_b = 16/9 - (H_a / W_a).
Since Box B is on the screen, if we force it to maintain that required aspect ratio, when the user drags Box B's corners, it scales uniformly (like holding Shift), maintaining H_b / W_b. 

Wait, the easiest UX for building an arbitrary cam+gameplay clipper:
- Let the user draw Box A and Box B.
- Instead of enforcing math on the frontend boxes directly, what if we provide a fixed 9:16 container, and a split line.
- The user moves the split line up or down. That defines the split. Say 30% top, 70% bottom.
- Then Box A MUST be an aspect ratio of 9 : (16 * 0.3) = 9:4.8
- Box B MUST be an aspect ratio of 9 : (16 * 0.7) = 9:11.2
- Then the user positions and scales Box A (its aspect ratio is locked to 9:4.8).
- The user positions and scales Box B (its aspect ratio is locked to 9:11.2).
- This EXACTLY solves "the aspect ratio in between the top and bottom should be fixed so it adjusts dynamically depending on each of the viewports".

Let's verify this UX:
1. There is a "split" variable (e.g. 0 to 1, default 0.33 meaning top is 1/3, bottom is 2/3).
2. The Top Box on the canvas is locked to aspect ratio `9 / (16 * split)`.
3. The Bottom Box on the canvas is locked to aspect ratio `9 / (16 * (1 - split))`.
4. The user can drag to reposition Top Box freely.
5. The user can resize Top Box (scales from corner), but it retains its locked aspect ratio.
6. Same for Bottom box.

Wait, if "it adjusts dynamically depending on each of the viewports that I size", maybe he means:
I resize Box A freely (changing its w and h arbitrarily).
Then the "split" is implicitly calculated as: `ratioA = Ha / Wa`.
Since `ratioA + ratioB = 16/9`, then `ratioB = 16/9 - ratioA`.
So Box B's aspect ratio instantly snaps to `16/9 - ratioA`.
If I then scale Box B, it must scale *uniformly* (locked aspect ratio).
If I resize Box B freely (non-uniformly), then Box A's aspect ratio must snap to `16/9 - ratioB`.
This means whichever box you are currently free-resizing dictates the aspect ratio of the *other* box.

Let's break down the mechanics:
State variables for the two crop zones:
`box1`: { x, y, w, h } (normalized 0 to 1 of source video width/height? Better to use pixel coordinates relative to video, or 0-1. Let's use 0-1)
`box2`: { x, y, w, h }

Constraint: `(h1/w1) + (h2/w2) = 16/9`

If the user drags the *corner* of `box1` to change its width and height:
- `h1` and `w1` update.
- We need to update `box2`. How? We change `h2` or `w2`? Usually, keeping `w2` the same and adjusting `h2` is jarring if it scales from the center without asking.
- Or we just lock `w1` and `w2`? 
- No, let's look at what "react to each other's size" means. 

If we have the Vertical Preview panel, it shows Box 1 stacked on Box 2.
The split line between them in the preview is exactly at `(h1/w1) / (16/9)` of the way down.
If we add a draggable split line *in the Vertical Preview panel itself*!
If the user drags the split line in the Vertical Preview:
- `split` changes from 0 to 1.
- `box1` aspect ratio becomes `9 / (16 * split)`.
- `box2` aspect ratio becomes `9 / (16 * (1-split))`.
- The boxes on the source video adjust their heights to match the new aspect ratios (keeping their widths constant, or keeping their centers constant).
Actually, free scaling Box A and Box B:
If Box A is free scalable, and Box B is free scalable.
When I drag Box A's corner, its width (W_A) and height (H_A) change.
Its new aspect ratio `r_A = H_A / W_A`.
Because we must maintain `r_A + r_B = 16/9`, the required aspect ratio for Box B becomes `r_B = 16/9 - r_A`.
To enforce `r_B` on Box B without the user touching it, we can either:
  1. Keep Box B's width constant, and change its height to `w_B * r_B`.
  2. Keep Box B's center constant, and change its height/width.
Keeping width constant is usually best (e.g., gameplay width stays same, just gets taller/shorter).

So the exact mechanics for the two boxes:
- We render two draggable, resizable boxes on the `MobileCropOverlay` over the video.
- Box 1 (Cam/Top). Box 2 (Game/Bottom).
- State:
  `box1`: { x, y, width } (normalized 0 to 1)
  `box2`: { x, y, width } (normalized 0 to 1)
  `splitRatio`: 0.33 (normalized 0 to 1, representing how much of the vertical 1920 height Box 1 takes).
- From `splitRatio`, we derive their heights:
  `box1.height = box1.width * (16/9 * splitRatio)`
  `box2.height = box2.width * (16/9 * (1 - splitRatio))`
- If the user resizes Box 1 (drags a corner):
  - They are changing `box1.width` and `box1.height`.
  - We calculate the new `splitRatio = (box1.height / box1.width) / (16/9)`.
  - We update `box1.width` to the dragged width.
  - We update `splitRatio`.
  - Box 2 automatically updates its height because `splitRatio` changed! (Its width remains whatever it was).
- If the user resizes Box 2 (drags a corner):
  - They change `box2.width` and `box2.height`.
  - We calculate the new `(1 - splitRatio) = (box2.height / box2.width) / (16/9)`.
  - We update `splitRatio = 1 - ((box2.height / box2.width) / (16/9))`.
  - We update `box2.width` to the dragged width.
  - Box 1 automatically updates its height because `splitRatio` changed!
- This perfectly satisfies "react to each other's size" and "aspect ratio between them should be fixed so it adjusts dynamically".
- Both boxes are also freely movable (update x, y).

Exporting:
We will use ffmpeg filter complex to stitch them together.
The command would look like:
`ffmpeg -i input.mp4 -filter_complex "[0:v]crop=W1:H1:X1:Y1,scale=1080:H_OUT1[top]; [0:v]crop=W2:H2:X2:Y2,scale=1080:H_OUT2[bottom]; [top][bottom]vstack[out]" -map "[out]" output.mp4`
This allows arbitrary cropping of top and bottom, scaling them to the same width (1080), and stacking them vertically, resulting exactly in a 1080x1920 video.
