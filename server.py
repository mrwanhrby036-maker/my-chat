from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import hashlib
import secrets
import time

from main import load_database, save_database, get_or_create_table


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


# ==========================================
# إدارة الجلسات (Sessions / Tokens)
# ==========================================

# مدة صلاحية الجلسة: 7 أيام (بالثواني)
SESSION_MAX_AGE = 7 * 24 * 60 * 60


def get_sessions_table(database):

    return get_or_create_table(
        database,
        "sessions",
        ["token", "user_id", "name", "created_at"]
    )


def create_session(database, user):

    # نمسح أي جلسات قديمة منتهية الصلاحية (تنظيف بسيط)
    sessions_table = get_sessions_table(database)

    now = int(time.time())

    sessions_table["rows"] = [
        session for session in sessions_table["rows"]
        if now - session.get("created_at", 0) < SESSION_MAX_AGE
    ]

    token = secrets.token_hex(32)

    sessions_table["rows"].append({
        "token": token,
        "user_id": user["id"],
        "name": user["name"],
        "created_at": now
    })

    save_database(database)

    return token


def find_session_by_token(database, token):

    if not token:
        return None

    sessions = get_sessions_table(database)["rows"]

    now = int(time.time())

    for session in sessions:

        if session.get("token") == token:

            # الجلسة منتهية الصلاحية
            if now - session.get("created_at", 0) >= SESSION_MAX_AGE:
                return None

            return session

    return None


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


    # التحقق من هوية صاحب الطلب من الـ Authorization header
    # بيرجع الـ session لو الـtoken صح، أو None لو غلط/مفقود
    def get_authenticated_session(self, database):

        header = self.headers.get("Authorization", "")

        if not header.startswith("Bearer "):
            return None

        token = header[len("Bearer "):].strip()

        return find_session_by_token(database, token)


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

            # لازم تسجل دخولك عشان تقرأ الرسائل
            session = self.get_authenticated_session(database)

            if session is None:

                self.send_json(
                    {"error": "لازم تسجل دخولك تاني"},
                    401
                )

                return


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

            # نفس الحماية: لازم تكون مسجل دخول
            session = self.get_authenticated_session(database)

            if session is None:

                self.send_json(
                    {"error": "لازم تسجل دخولك تاني"},
                    401
                )

                return


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

            database = load_database()

            # لازم يكون فيه token صحيح قبل ما نقبل أي رسالة
            session = self.get_authenticated_session(database)

            if session is None:

                self.send_json(
                    {"error": "لازم تسجل دخولك تاني"},
                    401
                )

                return


            data = self.read_json_body()

            message_text = data.get("message", "").strip()

            if not message_text:

                self.send_json(
                    {"error": "اكتب رسالة"},
                    400
                )

                return


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
                # الاسم جاي من الـsession نفسها، مش من العميل
                # عشان محدش يقدر ينتحل شخصية حد تاني
                "name": session["name"],
                "message": message_text
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


            token = create_session(database, new_user)

            response_data = public_user(new_user)
            response_data["token"] = token


            self.send_json(
                response_data,
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


            token = create_session(database, user)

            response_data = public_user(user)
            response_data["token"] = token


            self.send_json(
                response_data
            )

            return


        # تسجيل الخروج - إلغاء الـtoken من السيرفر
        if self.path == "/logout":

            database = load_database()

            session = self.get_authenticated_session(database)

            if session is not None:

                sessions_table = get_sessions_table(database)

                sessions_table["rows"] = [
                    row for row in sessions_table["rows"]
                    if row.get("token") != session.get("token")
                ]

                save_database(database)


            self.send_json({"ok": True})

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
