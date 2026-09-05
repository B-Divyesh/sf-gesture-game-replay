# Landing-page copy audit

Audited 2026-09-05. Counts use visible words; labels and code identifiers are
included where a screen reader reads them. Sentence fragments used as labels are
marked `label` and do not make a sentence-length claim.

| Visible copy | Words | Check |
| --- | ---: | --- |
| You’re offline. | 2 | pass |
| Imported fixtures and the full free workbench still work; license checks will resume later. | 13 | pass |
| Demo — sample data, nothing is saved | 7 | pass |
| You are using a separate sample workspace. | 7 | pass |
| Local gesture testing | 3 | label |
| Replay landmark traces to tune gesture rules | 7 | headline |
| For game and classroom-toy makers who need to fix missed moves without keeping player video. | 15 | pass |
| Try it with sample data | 6 | action |
| Loads a 41-frame wave trace to replay and compare. | 10 | pass |
| No video input | 3 | fact |
| Works offline after first visit | 5 | fact |
| Free replay and export | 4 | fact |
| Sample landmarks shown as a paper figure and rule paths. | 10 | pass |
| What the viewer does not do | 7 | heading |
| Get consent, collect only what the game needs, and delete fixtures when the test is done. | 16 | pass |
| Local fixture workbench | 3 | label |
| Replay a landmark trace | 5 | heading |
| Import JSON, use the example, or record landmark messages from your app. | 12 | pass |
| Nothing uploads. | 2 | pass |
| Current fixture | 2 | label |
| Bridge accepts validated messages only from an allowlisted first-party detector window that opened this viewer. | 14 | pass |
| Bring a landmark trace | 5 | heading |
| Drop a JSON fixture here or load the anonymous example. | 11 | pass |
| Raw video is neither requested nor supported. | 7 | pass |
| Keyboard: play/pause; step 100 ms; jump. | 6 | label |
| Frame inspector | 2 | heading |
| Threshold comparison | 2 | label |
| Where do the rules disagree? | 6 | heading |
| Confidence, rule A, rule B, and disagreement tracks over the duration of the loaded fixture. | 15 | pass |
| How it works | 3 | heading |
| Replay a fixture in three steps | 6 | heading |
| Typed ESM and CommonJS entries have no runtime dependencies. | 9 | pass |
| Send timestamped pose or hand arrays to LandmarkRecorder. | 8 | pass |
| Video is not an input. | 5 | pass |
| Use frameAt and ReplayClock for repeatable time and speed. | 9 | pass |
| Check threshold rules with hold time and inspect disagreement intervals. | 10 | pass |
| Keep the complete format, viewer, rule comparison, and scrubbed export free. | 11 | pass |
| The Adapter Pack adds ready-to-copy MediaPipe and TensorFlow.js bridges plus batch fixture manifests. | 13 | pass |
| One-time purchase. | 2 | pass |
| Sociobot/Dodo is the merchant of record and handles refunds. | 9 | pass |
| A refund automatically revokes the license. | 6 | pass |
| Gesture Replay Kit replays local landmark fixtures without video. | 9 | pass |
| Built by Param Factory · v0.1.0 | 6 | label |

No visible sentence exceeds 22 words. No banned non-literal wording appears.
The one use of “unlock” is literal license state in the paid section and is
allowed by the plain-words contract.

## Terminology table

| Concept | Single term used |
| --- | --- |
| Timestamped pose or hand coordinates | landmark trace |
| Versioned JSON recording | fixture |
| Sample sandbox recording | sample trace |
| Threshold test | rule |
| Difference between two rules | disagreement interval |
| Browser-only sample workspace | demo |
| Video/image input | video |
