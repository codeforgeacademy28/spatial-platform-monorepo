# Blueprint to Spatial 3D Workflow

## User workflow

1. **Upload blueprint**
   - Upload a JPG or PNG floor plan.
   - The blueprint is displayed as the 2D tracing background.

2. **Calibrate scale**
   - Choose a known real-world distance from the drawing.
   - Enter that distance in metres and select **Apply**.
   - The drawing is converted from pixels to metres using the calibrated scale.

3. **Trace walls in 2D**
   - Press and drag inside the 2D floor-plan canvas.
   - Release to create a wall segment.
   - Repeat for every wall that should become part of the 3D model.

4. **Validate rooms**
   - Connect wall endpoints to form closed loops.
   - Closed loops are analyzed by the geometry engine and detected as rooms.
   - Review room names and floor areas.

5. **Inspect 3D model**
   - Each wall is extruded automatically into 3D.
   - Use drag to orbit, wheel/scroll to zoom, and right-drag to pan.
   - The 3D viewport always reflects the current 2D wall model.

6. **Spatial / AR**
   - Enter the AR viewport after the 3D geometry is validated.
   - Save a project/version before sharing or comparison.

## Important behavior

- Blueprint upload is currently image-based (JPG/PNG).
- The 2D drawing coordinates are converted to real-world metres before they reach the geometry engine.
- Browser UI controls remain normal HTML controls; the 3D viewport does not lock the browser pointer.
- Share and AI features require `VITE_API_BASE_URL` to point to the deployed API.
