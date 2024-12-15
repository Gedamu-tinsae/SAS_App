import psycopg2
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
import os

# Database configuration (use environment variables for sensitive data)
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://username:pasword@localhost:port/db')

# Connect using SQLAlchemy
try:
    # Create engine and inspector
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    # Get the database name
    db_name = engine.url.database
    print(f"Database Name: {db_name}")

    # Get table names
    tables = inspector.get_table_names()
    print(f"Total Tables: {len(tables)}\n")

    # Iterate over each table and get row counts
    for table in tables:
        with engine.connect() as conn:
            # Use the `text` function for raw SQL execution
            result = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
            row_count = result.scalar()
            print(f"Table: {table}, Row Count: {row_count}")

except SQLAlchemyError as e:
    print(f"Error retrieving database metadata: {e}")
finally:
    engine.dispose()  # Close the engine connection
