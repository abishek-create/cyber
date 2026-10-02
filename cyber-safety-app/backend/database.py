import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///cyber_safety.db')

# Ensure sqlite relative path works consistently
if DATABASE_URL.startswith('sqlite:///'):
    engine = create_engine(
        DATABASE_URL,
        connect_args={'check_same_thread': False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency helper to yield database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all tables defined in models."""
    import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
