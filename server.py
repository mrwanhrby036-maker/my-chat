from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import hashlib
import secrets

from main import load_database, save_database


import os

HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 8000))


# ==========================================
# تشفير كلمة المرور
# ==========================================

def hash_password(password, salt=None):

    if salt is None:
        salt = secrets.token_hex(16)

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )

    return salt, hashed.hex()


def verify_password(password, salt, password_hash):

    _, new_hash = hash_password(password, salt)

    return secrets.compare_digest(new_hash, password_hash)


# ==========================================
# دوال مساعدة للمستخدمين
# ==========================================

def get_users_table(database):

    if "users" not in database:

        database["users"] = {
            "columns": [
                "id",
                "name",
                "age",
                "salt",
                "password_hash"
            ],
            "rows": []
        }

    return database["users"]


def find_user_by_name(users, name):

    name_lower = name.strip().lower()

    for user in users:

        if user.get("name", "").strip().lower() == name_lower:
            return user

    return None


def public_user(user):

    # نرجع بيانات المستخدم من غير كلمة المرور
    return {
        "id": user["id"],
        "name": user["name"],
        "age": user.get("age", 0)
    }


class Server(BaseHTTPRequestHandler):

    # إرسال JSON
    def send_json(self, data, status=200):

        response = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.end_headers()

        self.wfile.write(response)


    # قراءة الـ body بتاع الطلب
    def read_json_body(self):

        length = int(
            self.headers.get(
                "Content-Length",
                0
            )
        )

        body = self.rfile.read(length)

        if not body:
            return {}

        return json.loads(body.decode("utf-8"))


    # السماح للمتصفح بإرسال الطلبات
    def do_OPTIONS(self):

        self.send_response(204)

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )

        self.end_headers()


    # GET
    def do_GET(self):

        # جلب الرسائل
        if self.path == "/messages":

            database = load_database()

            messages = database.get(
                "messages",
                {
                    "columns": [
                        "id",
                        "name",
                        "message"
                    ],
                    "rows": []
                }
            )["rows"]

            self.send_json(messages)

            return


        # جلب المستخدمين (من غير كلمة المرور)
        if self.path == "/users":

            database = load_database()

            users = get_users_table(database)["rows"]

            self.send_json(
                [public_user(user) for user in users]
            )

            return


        self.send_json(
            {"error": "Route not found"},
            404
        )


    # POST
    def do_POST(self):

        # إضافة رسالة
        if self.path == "/messages":

            data = self.read_json_body()

            database = load_database()


            if "messages" not in database:

                database["messages"] = {
                    "columns": [
                        "id",
                        "name",
                        "message"
                    ],
                    "rows": []
                }


            messages = database["messages"]["rows"]


            new_message = {
                "id": len(messages) + 1,
                "name": data["name"],
                "message": data["message"]
            }


            messages.append(new_message)

            save_database(database)


            self.send_json(
                new_message,
                201
            )

            return


        # إنشاء حساب جديد
        if self.path == "/register":

            data = self.read_json_body()

            name = data.get("name", "").strip()
            password = data.get("password", "")


            if not name or not password:

                self.send_json(
                    {"error": "الاسم وكلمة المرور مطلوبين"},
                    400
                )

                return


            if len(password) < 4:

                self.send_json(
                    {"error": "كلمة المرور لازم تكون 4 حروف على الأقل"},
                    400
                )

                return


            database = load_database()

            users_table = get_users_table(database)

            users = users_table["rows"]


            if find_user_by_name(users, name):

                self.send_json(
                    {"error": "الاسم ده مستخدم بالفعل، جرب اسم تاني"},
                    409
                )

                return


            salt, password_hash = hash_password(password)


            new_user = {
                "id": len(users) + 1,
                "name": name,
                "age": data.get("age", 0),
                "salt": salt,
                "password_hash": password_hash
            }


            users.append(new_user)

            save_database(database)


            self.send_json(
                public_user(new_user),
                201
            )

            return


        # تسجيل الدخول
        if self.path == "/login":

            data = self.read_json_body()

            name = data.get("name", "").strip()
            password = data.get("password", "")


            if not name or not password:

                self.send_json(
                    {"error": "الاسم وكلمة المرور مطلوبين"},
                    400
                )

                return


            database = load_database()

            users = get_users_table(database)["rows"]

            user = find_user_by_name(users, name)


            # المستخدم مش موجود، أو حساب قديم من غير كلمة مرور
            if not user or "salt" not in user or "password_hash" not in user:

                self.send_json(
                    {"error": "اسم المستخدم أو كلمة المرور غلط"},
                    401
                )

                return


            if not verify_password(
                password,
                user["salt"],
                user["password_hash"]
            ):

                self.send_json(
                    {"error": "اسم المستخدم أو كلمة المرور غلط"},
                    401
                )

                return


            self.send_json(
                public_user(user)
            )

            return


        self.send_json(
            {"error": "Route not found"},
            404
        )


server = HTTPServer(
    (HOST, PORT),
    Server
)


print(
    f"Backend running on http://{HOST}:{PORT}"
)


server.serve_forever()
