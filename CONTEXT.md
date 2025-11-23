Below is a self-contained context file you can drop into PROJECT_CONTEXT.txt or CONTEXT.md and reuse with any coding assistant.

Updated as of git commit 76b301a6f018360c46c77763e781fc26ab9060e8 (HEAD -> main, origin/main, origin/HEAD)
⸻

Project: ApexIQ – Real-Time AI Sim-Racing Coach

1. High-level concept

ApexIQ is a real-time AI racing coach for sim drivers.
Long term, the app should behave like a virtual race engineer:
	•	It reads live telemetry from a racing sim.
	•	It analyzes the driver’s performance per corner and per lap.
	•	It gives short, spoken tips in real time through headphones.
	•	After the stint, it gives a structured debrief and tracks progress over time.

The final architecture should separate:
	1.	A proprietary logic engine / model that turns telemetry and features into structured coaching decisions.
	2.	An external LLM that only converts those structured decisions into human, natural-language coaching (text + TTS), not the other way around.

The LLM is for communication and phrasing, not core driving logic.

⸻

2. Current state (lightweight version already built)

There is already a lightweight, post-session web app deployed (MVP).
Current behavior:
	•	Stack:
	•	Next.js with App Router and TypeScript.
	•	Hosted on Vercel.
	•	Supabase used for:
	•	Auth (basic user login).
	•	Postgres database.
	•	Storage for uploaded telemetry files.
	•	Tailwind CSS for styling.
	•	Features:
	•	User signs in and uploads a telemetry CSV with a fixed schema (per-lap or per-session features).
	•	Server-side code:
	•	Parses and validates the CSV.
	•	Computes simple deterministic metrics:
	•	Best lap, lap deltas, consistency measures.
	•	Basic braking and throttle summaries.
	•	A few “notable findings” based on thresholds.
	•	Calls an external LLM API (e.g., OpenAI / similar) with:
	•	Car, track, session metadata.
	•	Computed metrics and notable findings.
	•	The LLM returns a strict JSON “coaching report” with fields like:
	•	Overall headline and 2–3 key takeaways.
	•	Pace, braking, throttle sections (scores, issues, actions).
	•	A list of problem corners with evidence and suggested fixes.
	•	A “next session plan” with drills and what to measure.
	•	The JSON report is stored in Supabase and shown in a simple report page.
	•	There is a history page that lists past uploads/reports per user.

This MVP is working and should be treated as the starting point, not rebuilt from scratch.

⸻

3. Long-term vision for the full app

The full app will consist of two main components:
1.  **Web App (Existing):** For account management, downloading the desktop app, and deep-dive session analysis.
2.  **Desktop App (New):** A downloadable client (likely Electron) that runs locally to capture telemetry, manage the session, and provide the overlay.

Real-time coaching (target behavior)
	•	**Desktop App Interface:**
        •   **Main Window:** Settings, session management, car/track selection.
        •   **Overlay:** Minimalist, "Always on Top" overlay for critical info (e.g., current status, recording indicator).
	•	**Communication Policy ("Quiet Zones"):**
        •   The coach MUST NOT speak during technical/difficult corners.
        •   Speech is reserved for straights and wide/sweeping corners (low cognitive load areas).
        •   **Feedback Loop:**
            1.  *After* a corner: Brief feedback on mistakes (e.g., "Braked too late").
            2.  *Before* the same corner (next lap): Actionable reminder (e.g., "Brake at the 100 board this time").
	•	**AI Strategy (Cost/Latency Optimization):**
        •   **Phase 1 (Interim):** "Flying Lap Batching".
            •   Lap 1: Silent data collection.
            •   End of Lap 1: Send full lap data to LLM (Gemini).
            •   LLM generates a "Coaching Script" for the *next* lap, mapped to track locations.
            •   Lap 2: System plays back the pre-generated cues at the correct track positions.
            •   *Simultaneously* record Lap 2 to generate Lap 3's script.
        •   **Phase 2 (Final):** Proprietary Local Model.
            •   Replace the "Batching" with a local, real-time neural model (built after CS50AI).
            •   LLM is only used for TTS/Phrasing, reducing cost and latency further.

Progression tracking
	•	Each session is stored with:
	•	Telemetry summary.
	•	Coaching decisions and messages.
	•	Track, car, date, and session type metadata.
	•	A dashboard lets drivers:
	•	Filter by track, car, session type.
	•	Compare sessions over time.
	•	See trends in:
	•	Lap time consistency.
	•	Braking quality.
	•	Corner performance scores.

⸻

4. AI and modeling strategy

The long-term AI plan has clear phases:

Phase 0–1: Rules and heuristics (current + near-future)
	•	Telemetry → hand-crafted features:
	•	Corner segments.
	•	Braking point offset from best/reference.
	•	Min corner speed.
	•	Throttle/brake overlap.
	•	Lap time deltas, stints, degradation.
	•	Logic engine = deterministic rules:
	•	If braking point offset > X consistently → flag late braking.
	•	If min speed consistently low in a corner → flag under-driving mid-corner.
	•	If lap time variance high → flag inconsistency.
	•	LLM is only used to:
	•	Turn structured events (corner_id, issue, evidence, priority) into human text.
	•	Possibly pick which events to talk about with some guidance.

Phase 2: Classic ML for specific sub-tasks

Once there is enough real data:
	•	Use basic models (e.g., regression, random forest, gradient boosting) for:
	•	Predicting expected corner time given inputs.
	•	Scoring corner execution quality.
	•	Classifying mistake type from features.
	•	These models run alongside rules, not instead of them.

Phase 3: Proprietary neural model components

Long-term:
	•	Train one or more small, specialized neural models to:
	•	Score corner performance.
	•	Rank “opportunity corners” where the driver can gain the most.
	•	Learn driver-specific adaptation.
	•	These models, plus the feature-engineering and training data, are the core proprietary IP.
	•	The LLM remains an external component used only for natural-language output.

Important:
Do not build custom models yet.
The app first needs robust telemetry ingestion, feature engineering, and rule-based logic. Model work comes later.

⸻

5. Development priorities from this point

The current focus is continuing the full app, not doing CS50AI or ML first.

From here, the coding assistant should help with:
	1.	Desktop App Foundation
	•	Initialize a new Electron/Tauri project for the desktop client.
    •   Create the basic UI (Settings Window + Overlay).
	2.	Real-time pipeline groundwork
	•	Design a clean interface for telemetry input (even if initially mocked or replayed from logs).
	•	Create a track/segment representation so we can talk about “Turn 1”, “Turn 3”, etc.
	•	Reuse and generalize the existing CSV parsing and metric code for live or replayed data.
	3.	Event and logic layer
	•	Build a module that takes a stream of telemetry points and emits:
	•	Segment entry/exit events.
	•	Detected issues (late braking, low min speed, unstable throttle, etc.).
	•	Keep this layer deterministic and testable.
	•	Design its outputs as structured objects ready for language generation.
	4.	Voice and messaging
	•	Integrate TTS for spoken feedback.
	•	Define message templates and/or LLM prompts that:
	•	Take structured events as input.
	•	Return short coaching lines.
	•	Implement policies for when and how often to speak.
	5.	Session storage and review
	•	Extend the existing DB schema:
	•	Sessions / stints.
	•	Events per session.
	•	Coaching messages.
	•	Build UI for reviewing a session:
	•	Summary, charts, list of issues, and drill plan.
	6.	Incremental refactors
	•	Keep using Next.js + Supabase.
	•	Improve type safety and organization as needed.
	•	Avoid rewriting working MVP pieces unless necessary.

⸻

6. Constraints and preferences
	•	Use current stable versions of libraries and frameworks where possible.
	•	Prefer free tiers and open-source tools (Vercel, Supabase, etc.).
	•	Keep the codebase:
	•	Modular (clear separation: telemetry, features, logic, AI integration, UI).
	•	Easy to extend.
	•	When proposing changes:
	•	Work incrementally and specify which files and functions are affected.
	•	Avoid “big bang” rewrites.
	•	The final system should make it easy, later on, to:
	•	Swap out heuristic logic for ML models.
	•	Swap or add LLM providers for language generation.

⸻

7. How to use this context (for the assistant)

You, the coding assistant (e.g., Google Antigravity, OpenAI Codex, or similar), should:
	•	Treat this file as the source of truth for:
	•	Project goals.
	•	Long-term architecture.
	•	Current state of the code and app.
	•	Assume the lightweight web app is already implemented and working as described.
	•	Focus on:
	•	Extending features toward real-time coaching.
	•	Improving telemetry handling, analysis, and session UX.
	•	Keeping the future modeling plan in mind, but not implementing custom models yet.
	•	Always preserve:
	•	The separation between core logic engine and language/voice layer.
	•	The idea that the logic engine should be proprietary and explainable.