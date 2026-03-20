import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import DATABASE_URL, Base
from app.models.user import User
from app.security.auth import get_password_hash
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()
async def seed_admin():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        admin_email = os.getenv("DEFAULT_ADMIN_EMAIL")
        admin_pw = os.getenv("DEFAULT_ADMIN_PASSWORD")
        if not admin_email or not admin_pw:
            raise ValueError("Environment variables DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set in .env")

        # Check if user exists
        from sqlalchemy.future import select
        result = await session.execute(select(User).filter_by(email=admin_email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Creating default admin user: {admin_email}...")
            hashed_pw = get_password_hash(admin_pw)
            admin = User(
                email=admin_email,
                hashed_password=hashed_pw,
                role="admin"
            )
            session.add(admin)
            await session.commit()
            print("Admin successfully created from environment bounds.")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
