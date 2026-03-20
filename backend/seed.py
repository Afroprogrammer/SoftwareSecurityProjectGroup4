import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import DATABASE_URL, Base
from app.models.user import User
from app.security.auth import get_password_hash
from passlib.context import CryptContext

async def seed_admin():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Check if user exists
        from sqlalchemy.future import select
        result = await session.execute(select(User).filter_by(email="admin@securenet.local"))
        user = result.scalar_one_or_none()
        
        if not user:
            print("Creating default admin user...")
            hashed_pw = get_password_hash("SuperSecurePassword123!")
            admin = User(
                email="admin@securenet.local",
                hashed_password=hashed_pw,
                role="admin"
            )
            session.add(admin)
            await session.commit()
            print("Admin created. Email: admin@securenet.local, Password: SuperSecurePassword123!")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
