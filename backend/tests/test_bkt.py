import pytest
from app.core.bkt import BKTEngine, BKTParameters

def test_bkt_correct_answer_increases_mastery():
    params = BKTParameters(p_l0=0.30, p_t=0.15, p_g=0.25, p_s=0.10)
    result = BKTEngine.update_mastery(
        current_mastery=0.30,
        is_correct=True,
        params=params,
        difficulty="Medium"
    )
    # A correct answer must increase estimated mastery
    assert result.updated_mastery > 0.30
    assert result.mastery_delta > 0
    assert result.is_correct is True

def test_bkt_incorrect_answer_decreases_mastery():
    params = BKTParameters(p_l0=0.70, p_t=0.15, p_g=0.25, p_s=0.10)
    result = BKTEngine.update_mastery(
        current_mastery=0.70,
        is_correct=False,
        params=params,
        difficulty="Medium"
    )
    # An incorrect answer reduces evidence of mastery
    assert result.updated_mastery < 0.70
    assert result.mastery_delta < 0
    assert result.is_correct is False

def test_bkt_mastery_states():
    assert BKTEngine.get_mastery_state(0.15) == "NOVICE"
    assert BKTEngine.get_mastery_state(0.50) == "DEVELOPING"
    assert BKTEngine.get_mastery_state(0.75) == "PROFICIENT"
    assert BKTEngine.get_mastery_state(0.90) == "MASTERED"

def test_bkt_recommended_difficulty():
    assert BKTEngine.get_recommended_difficulty(0.20) == "Easy"
    assert BKTEngine.get_recommended_difficulty(0.55) == "Medium"
    assert BKTEngine.get_recommended_difficulty(0.88) == "Hard"
