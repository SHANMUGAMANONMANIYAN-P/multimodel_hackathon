# EduAdapt AI — Benchmark & Evaluation Suite

This module fulfills the Hackathon 2026 Track D evaluation requirements for retrieval accuracy, answer generation faithfulness, unsupported refusal rate, and Bayesian Knowledge Tracing (BKT) learner mastery convergence.

## Running the Evaluation

### Via Web Application:
1. Navigate to the **"Benchmark & Evaluation"** tab in the sidebar.
2. Click **"Run Live Benchmark"**.
3. Inspect the updated metric cards and interactive 8-round learner trajectory chart.

### Via Command Line:
```bash
# In the eduadapt-ai directory:
.\backend\.venv\Scripts\python evaluation\run_evaluation.py
```

## Metrics Computed

1. **Faithfulness**: Proportion of generated answer claims supported by retrieved source text.
2. **Answer Relevancy**: Semantic and keyword alignment between student query and response.
3. **Context Precision**: Ratio of top retrieved chunks containing relevant evidence.
4. **Context Recall**: Proportion of gold benchmark evidence successfully retrieved.
5. **Citation Accuracy**: Proportion of claims accompanied by verified, non-hallucinated citations.
6. **Unsupported Refusal Rate**: Refusal rate when answering questions whose content is absent from uploaded materials (tests anti-hallucination defense).
7. **Question Verification Rate**: Programmatic formula checking rate for numerical problems and objective answer keys.
8. **Question Duplication Rate**: Uniqueness of generated questions across student practice history using cryptographic SHA-256 fingerprints.
