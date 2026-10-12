"""
Bayesian Knowledge Tracing (BKT) Engine for EduAdapt AI.

Implements the standard Corbett & Anderson (1995) formulation:
- P(L0): Initial probability of knowing the knowledge component.
- P(T):  Transition probability (probability of learning on each trial).
- P(G):  Guess probability (probability of answering correctly when unknown).
- P(S):  Slip probability (probability of answering incorrectly when known).
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class BKTParameters(BaseModel):
    p_l0: float = Field(0.20, description="Initial probability of mastery")
    p_t: float = Field(0.15, description="Transition/learning probability")
    p_g: float = Field(0.25, description="Guess probability")
    p_s: float = Field(0.10, description="Slip probability")

class BKTUpdateResult(BaseModel):
    prior_mastery: float
    posterior_given_obs: float
    updated_mastery: float
    is_correct: bool
    mastery_delta: float
    mastery_state: str
    explanation: str

class BKTEngine:
    @staticmethod
    def get_mastery_state(prob: float) -> str:
        if prob >= 0.85:
            return "MASTERED"
        elif prob >= 0.70:
            return "PROFICIENT"
        elif prob >= 0.40:
            return "DEVELOPING"
        else:
            return "NOVICE"

    @staticmethod
    def update_mastery(
        current_mastery: float,
        is_correct: bool,
        params: Optional[BKTParameters] = None,
        difficulty: str = "Medium"
    ) -> BKTUpdateResult:
        """
        Updates the probability of mastery following a student answer.
        Adjusts guess and slip dynamically based on item difficulty:
        - Easy: slightly higher guess, lower slip
        - Hard: lower guess, higher slip
        """
        p = params or BKTParameters()
        
        # Difficulty modifiers
        p_g = p.p_g
        p_s = p.p_s
        p_t = p.p_t
        
        if difficulty.lower() == "easy":
            p_g = min(0.35, p.p_g * 1.2)
            p_s = max(0.05, p.p_s * 0.8)
        elif difficulty.lower() == "hard":
            p_g = max(0.12, p.p_g * 0.7)
            p_s = min(0.20, p.p_s * 1.4)
            
        p_l = max(0.001, min(0.999, current_mastery))
        
        # 1. Evidence update: P(L_t | observation)
        if is_correct:
            numerator = p_l * (1.0 - p_s)
            denominator = (p_l * (1.0 - p_s)) + ((1.0 - p_l) * p_g)
            p_l_obs = numerator / max(1e-9, denominator)
            obs_type = "Correct answer (+evidence)"
        else:
            numerator = p_l * p_s
            denominator = (p_l * p_s) + ((1.0 - p_l) * (1.0 - p_g))
            p_l_obs = numerator / max(1e-9, denominator)
            obs_type = "Incorrect answer (-evidence)"
            
        # 2. Transition update: P(L_{t+1}) = P(L_t | obs) + (1 - P(L_t | obs)) * P(T)
        p_l_next = p_l_obs + ((1.0 - p_l_obs) * p_t)
        p_l_next = max(0.01, min(0.99, round(p_l_next, 4)))
        p_l_obs = round(p_l_obs, 4)
        
        delta = round(p_l_next - current_mastery, 4)
        state = BKTEngine.get_mastery_state(p_l_next)
        
        explanation = (
            f"Based on {obs_type} on a {difficulty} problem: posterior belief updated from "
            f"{current_mastery:.1%} to {p_l_obs:.1%}, and with learning transition (P(T)={p_t:.2f}), "
            f"estimated mastery is now {p_l_next:.1%} ({state})."
        )
        
        return BKTUpdateResult(
            prior_mastery=current_mastery,
            posterior_given_obs=p_l_obs,
            updated_mastery=p_l_next,
            is_correct=is_correct,
            mastery_delta=delta,
            mastery_state=state,
            explanation=explanation
        )

    @staticmethod
    def get_recommended_difficulty(mastery: float) -> str:
        """Determines next optimal quiz difficulty based on mastery level"""
        if mastery < 0.40:
            return "Easy"
        elif mastery < 0.75:
            return "Medium"
        else:
            return "Hard"
