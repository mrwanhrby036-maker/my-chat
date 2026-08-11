from http.server import BaseHTTPRequestHandler, HTTPServer
import json

from main import load_database, save_database


import os

HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 8000))


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


        # جلب المستخدمين
        if self.path == "/users":

            database = load_database()

            users = database.get(
                "users",
                {
                    "columns": [
                        "id",
                        "name",
                        "age"
                    ],
                    "rows": []
                }
            )["rows"]

            self.send_json(users)

            return


        self.send_json(
            {"error": "Route not found"},
            404
        )


    # POST
    def do_POST(self):

        # إضافة رسالة
        if self.path == "/messages":

            length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(length)

            data = json.loads(
                body.decode("utf-8")
            )

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


        # إضافة مستخدم
        if self.path == "/users":

            length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(length)

            data = json.loads(
                body.decode("utf-8")
            )

            database = load_database()


            if "users" not in database:

                database["users"] = {
                    "columns": [
                        "id",
                        "name",
                        "age"
                    ],
                    "rows": []
                }


            users = database["users"]["rows"]


            new_user = {
                "id": len(users) + 1,
                "name": data["name"],
                "age": data.get("age", 0)
            }


            users.append(new_user)

            save_database(database)


            self.send_json(
                new_user,
                201
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