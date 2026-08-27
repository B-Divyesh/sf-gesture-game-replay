# `gesture-replay/v1` fixture format

The format is deliberately small JSON. Times are milliseconds from the start of the recording; coordinates follow the detector's normalized coordinate space. A fixture contains no pixels, audio, face descriptors, names, or device identifiers.

```json
{
  "format": "gesture-replay/v1",
  "duration": 32,
  "frames": [
    {
      "t": 16,
      "pose": [{ "x": 0.42, "y": 0.24, "z": -0.03, "visibility": 0.98 }]
    }
  ],
  "metadata": { "source": "mediapipe-pose", "consent": true }
}
```

`pose`, `leftHand`, and `rightHand` are optional per frame, but at least one must be present. `x` and `y` are required finite numbers. `z`, `visibility`, and `presence` are optional finite numbers. Frames must be ordered and the last timestamp cannot exceed `duration`.

`metadata` is optional. `scrubFixture()` removes `source`, `notes`, and dates by default, rounds coordinates, and shifts the first frame to `t = 0`. Landmarks may remain biometric data even after scrubbing; share only with consent and a deletion plan.
