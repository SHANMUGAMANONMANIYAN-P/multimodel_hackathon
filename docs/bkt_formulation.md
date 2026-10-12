# Bayesian Knowledge Tracing (BKT) — Mathematical Formulation

EduAdapt AI implements a mathematically rigorous, explainable learner model using standard **Corbett & Anderson (1995)** Bayesian Knowledge Tracing.

## 1. Parameters

For any knowledge component (topic) $k$, the state space consists of binary latent knowledge $\{L_t, \neg L_t\}$ (known or unknown) at trial $t$.

| Parameter | Symbol | Default Value | Description |
|-----------|--------|---------------|-------------|
| Initial Mastery | $P(L_0)$ | 0.20 | Prior probability student knows topic prior to practice |
| Learning Rate | $P(T)$ | 0.15 | Transition probability of learning on each opportunity |
| Guess | $P(G)$ | 0.25 | Probability of correct response when unmastered |
| Slip | $P(S)$ | 0.10 | Probability of incorrect response despite mastery |

## 2. Evidence Update Equations

Upon observing student response $obs \in \{1 \text{ (correct)}, 0 \text{ (incorrect)}\}$:

### When Student Answers Correctly ($obs = 1$):
$$P(L_t \mid obs=1) = \frac{P(L_t) \cdot (1 - P(S))}{P(L_t) \cdot (1 - P(S)) + (1 - P(L_t)) \cdot P(G)}$$

### When Student Answers Incorrectly ($obs = 0$):
$$P(L_t \mid obs=0) = \frac{P(L_t) \cdot P(S)}{P(L_t) \cdot P(S) + (1 - P(L_t)) \cdot (1 - P(G))}$$

## 3. Transition Update (Learning Opportunity)

After updating belief based on observation, student experiences a learning transition:
$$P(L_{t+1}) = P(L_t \mid obs) + (1 - P(L_t \mid obs)) \cdot P(T)$$

## 4. Item Difficulty Modulation

EduAdapt AI modulates $P(G)$ and $P(S)$ dynamically based on problem difficulty:
- **Easy**: $P(G)' = \min(0.35, P(G) \cdot 1.2)$, $P(S)' = \max(0.05, P(S) \cdot 0.8)$
- **Hard**: $P(G)' = \max(0.12, P(G) \cdot 0.7)$, $P(S)' = \min(0.20, P(S) \cdot 1.4)$

## 5. Mastery State Classification

- **NOVICE**: $P(L) < 0.40$ (Requires foundational review, easy questions)
- **DEVELOPING**: $0.40 \le P(L) < 0.70$ (Guided practice, medium questions)
- **PROFICIENT**: $0.70 \le P(L) < 0.85$ (Advanced applications, hard challenge items)
- **MASTERED**: $P(L) \ge 0.85$ (Syllabus concept mastered, move to dependent prerequisites)
