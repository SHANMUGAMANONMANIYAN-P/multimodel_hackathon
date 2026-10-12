import pytest
from app.core.database import Base, engine
from app.seed_data import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
