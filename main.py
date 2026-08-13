import json
import os

import psycopg2
from psycopg2.extras import Json


DATABASE_FILE = "database.json"
DATABASE_URL = os.environ.get("DATABASE_URL")


# ==========================================
# PostgreSQL
# ==========================================

def get_connection():
    if not DATABASE_URL:
        return None

    return psycopg2.connect(DATABASE_URL)


def init_postgres():
    connection = get_connection()

    if connection is None:
        return

    try:
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_data (
                        table_name TEXT PRIMARY KEY,
                        data JSONB NOT NULL
                    )
                    """
                )
    finally:
        connection.close()


def load_database_from_postgres():
    init_postgres()

    connection = get_connection()

    if connection is None:
        return {}

    database = {}

    try:
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT table_name, data
                    FROM app_data
                    """
                )

                for table_name, data in cursor.fetchall():
                    database[table_name] = data
    finally:
        connection.close()

    return database


def save_database_to_postgres(database):
    init_postgres()

    connection = get_connection()

    if connection is None:
        return

    try:
        with connection:
            with connection.cursor() as cursor:

                for table_name, data in database.items():
                    cursor.execute(
                        """
                        INSERT INTO app_data (table_name, data)
                        VALUES (%s, %s)
                        ON CONFLICT (table_name)
                        DO UPDATE SET data = EXCLUDED.data
                        """,
                        (table_name, Json(data))
                    )

                cursor.execute(
                    """
                    SELECT table_name
                    FROM app_data
                    """
                )

                existing_tables = {
                    row[0]
                    for row in cursor.fetchall()
                }

                for table_name in existing_tables - set(database.keys()):
                    cursor.execute(
                        """
                        DELETE FROM app_data
                        WHERE table_name = %s
                        """,
                        (table_name,)
                    )

    finally:
        connection.close()


# ==========================================
# Local database.json fallback / migration
# ==========================================

def load_database_from_file():

    if not os.path.exists(DATABASE_FILE):
        return {}

    try:
        if os.path.getsize(DATABASE_FILE) == 0:
            return {}

        with open(
            DATABASE_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            content = file.read().strip()

        if not content:
            return {}

        return json.loads(content)

    except (json.JSONDecodeError, OSError):
        return {}


def save_database_to_file(database):

    with open(
        DATABASE_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            database,
            file,
            indent=4,
            ensure_ascii=False
        )


def load_database():

    # Railway / production
    if DATABASE_URL:

        database = load_database_from_postgres()

        # On the first PostgreSQL startup, migrate the existing
        # local database.json if it is present and valid.
        if not database:

            local_database = load_database_from_file()

            if local_database:
                save_database_to_postgres(local_database)
                return local_database

        return database

    # Local development
    return load_database_from_file()


def save_database(database):

    # Railway / production
    if DATABASE_URL:
        save_database_to_postgres(database)
        return

    # Local development
    save_database_to_file(database)


# ==========================================
# Existing database helpers
# ==========================================

database = load_database()


def create_table(name, columns):

    if name in database:
        return False

    database[name] = {
        "columns": columns,
        "rows": []
    }

    save_database(database)

    return True


def get_or_create_table(database, name, columns):

    if name not in database:

        database[name] = {
            "columns": columns,
            "rows": []
        }

        save_database(database)

    return database[name]


def insert_into(table_name, values):

    if table_name not in database:
        return False

    table = database[table_name]

    if len(values) != len(table["columns"]):
        return False

    row = dict(
        zip(
            table["columns"],
            values
        )
    )

    table["rows"].append(row)

    save_database(database)

    return True