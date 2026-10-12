# EduAdapt AI — 12-Step Hackathon Demonstration Script

Follow these steps for a live hackathon demonstration of EduAdapt AI.

## Step 1: Authentication & Demo Login
- Open the application at `http://localhost:5173`.
- Click **"Start Learning"** or **"Sign In"**.
- Click **"One-Click Demo Login (Alex Rivera)"** to instantly load the demo profile with pre-indexed materials.

## Step 2: Ingested Materials Overview
- Navigate to **"Materials Library"**.
- View pre-indexed materials:
  - `deep_learning_ch4_optimization.pdf` (14 pages)
  - `lecture_slides_nn_attention.pptx` (24 slides)
  - `lecture_08_backprop_autodiff.srt` (Video transcript with timestamps)

## Step 3: Inspect Extracted Chunks & Topics
- Click on any material card to open the **Chunk Viewer Modal**.
- Inspect exact chunk text, slide numbers, page numbers, and detected topic tags (`#Gradient Descent Optimization`, `#Transformers & Attention`).

## Step 4: Ask In-Corpus Question to AI Tutor
- Navigate to **"AI Tutor Chat"**.
- Click the suggested question:
  > *"How does the Hessian matrix condition number affect gradient descent convergence?"*
- Observe the grounded answer citing **[Source 1: Page 5]**.

## Step 5: Click Exact Source Citation
- Click the citation badge **[deep_learning_ch4... Page 5]**.
- The **Source Viewer Modal** opens, highlighting Page 5 of the textbook with the Hessian eigenvalue curvature formulation.

## Step 6: Test Unanswerable Query & Verification Refusal
- In the tutor chat, enter an out-of-domain query:
  > *"What are the superconductivity vortex lines of liquid helium-4 superfluid?"*
- Observe the amber **Source Verification Notice**:
  > *"I couldn't verify this answer from your uploaded course materials."*
- Proves zero hallucination and strict grounding!

## Step 7: Generate Adaptive Assessment
- Navigate to **"Adaptive Quizzes"**.
- Select topic: **"Gradient Descent Optimization"**.
- Difficulty: **"Adaptive"**.
- Click **"Start Adaptive Assessment"**.

## Step 8: Complete Quiz & Receive Feedback
- Answer the generated questions (MCQ, short answer, numerical).
- Click **"Submit & View Results"**.
- Inspect correct/incorrect items, answer keys, and source-cited explanations.

## Step 9: Observe Misconceptions & Weak Topics
- Review the **Inferred Conceptual Misconceptions** panel.
- Inspect the **Bayesian Knowledge Tracing (BKT)** posterior mastery update (`+12%` or `-8%`).

## Step 10: Retake Quiz to Demonstrate Mastery Growth
- Click **"Take Another Quiz"**.
- Complete practice items to observe BKT mastery increasing from NOVICE to DEVELOPING or PROFICIENT.

## Step 11: Return to Dashboard
- Click **"Dashboard"**.
- Observe updated mastery index, updated topic mastery bar charts, and adaptive revision recommendations.

## Step 12: Run Evaluation & Benchmarks
- Navigate to **"Benchmark & Evaluation"**.
- If not yet evaluated, view the clean **"Not evaluated yet"** state.
- Click **"Run Live Benchmark"**.
- Review computed metrics:
  - Faithfulness (95%+)
  - Citation Accuracy (100%)
  - Unsupported Refusal Rate (100%)
  - Synthetic Learner Simulation trajectory chart over 8 rounds.
