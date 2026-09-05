# Demo sandbox

Open <https://gesture-game-replay.sociobot.in/demo> or use **Try it with
sample data** on the landing page. The first view is the loaded workbench, not
an empty form.

The shipped sample is an anonymous 4-second, 41-frame pose wave. It contains
only normalized landmark coordinates and confidence values. It has no image,
video, name, or external source data. The sample starts at frame one, so a
visitor can play it, edit the two rule thresholds, inspect the disagreement
timeline, and export a scrubbed fixture immediately.

Demo mode uses its own `localStorage` marker named
`demo:gesture-game-replay:session`; imported sample and fixture data remain in
tab memory. The demo never reads or writes free-workbench data in a real-data
namespace. It also skips license initialization, so it cannot read or update a
visitor's license state.

The persistent **Demo — sample data, nothing is saved** banner identifies the
sandbox. **Reset demo** replaces the current in-memory fixture with the shipped
sample. **Start for real** removes the demo marker, discards the tab data by
navigating to the empty home workbench, and never copies the demo fixture into
real data.
