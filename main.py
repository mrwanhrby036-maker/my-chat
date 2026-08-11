import json
import os


DATABASE_FILE = "database.json"


def load_database():

    if not os.path.exists(DATABASE_FILE):
        return {}

    with open(
        DATABASE_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


def save_database(database):

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