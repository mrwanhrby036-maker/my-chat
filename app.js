// ==========================================
// إعدادات التطبيق
// ==========================================

// أثناء التطوير على جهازك
const API_URL = "http://127.0.0.1:8000";

// لما نرفع الـBackend على الإنترنت هنغير السطر
// فوق فقط إلى رابط السيرفر الحقيقي.



// ==========================================
// عناصر الصفحة
// ==========================================

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const loginError = document.getElementById("loginError");

const currentUser = document.getElementById("currentUser");

const messagesContainer = document.getElementById("messages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");



// ==========================================
// بيانات المستخدم الحالي
// ==========================================

let user = null;



// ==========================================
// تسجيل الدخول
// ==========================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = usernameInput.value.trim();

    if (!name) {
        loginError.textContent = "اكتب اسمك الأول";
        return;
    }

    loginError.textContent = "";

    try {

        const response = await fetch(`${API_URL}/users`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name
            })

        });


        if (!response.ok) {
            throw new Error("فشل تسجيل المستخدم");
        }


        user = await response.json();


        // إخفاء شاشة الدخول
        loginScreen.hidden = true;

        // إظهار الشات
        chatScreen.hidden = false;


        // عرض اسم المستخدم
        currentUser.textContent = `أنت: ${user.name}`;


        // تحميل الرسائل
        await loadMessages();


        // وضع المؤشر داخل مربع الرسالة
        messageInput.focus();

    } catch (error) {

        console.error(error);

        loginError.textContent =
            "حصلت مشكلة في الاتصال بالسيرفر";

    }

});



// ==========================================
// تحميل الرسائل
// ==========================================

async function loadMessages() {

    try {

        const response = await fetch(
            `${API_URL}/messages`
        );


        if (!response.ok) {
            throw new Error("فشل تحميل الرسائل");
        }


        const messages = await response.json();


        displayMessages(messages);

    } catch (error) {

        console.error(
            "خطأ في تحميل الرسائل:",
            error
        );

    }

}



// ==========================================
// عرض الرسائل
// ==========================================

function displayMessages(messages) {

    messagesContainer.innerHTML = "";


    messages.forEach(function (message) {

        const messageElement =
            document.createElement("div");

        messageElement.className = "message";


        const nameElement =
            document.createElement("div");

        nameElement.className = "name";

        nameElement.textContent =
            message.name;


        const textElement =
            document.createElement("div");

        textElement.className = "text";

        textElement.textContent =
            message.message;


        messageElement.appendChild(
            nameElement
        );

        messageElement.appendChild(
            textElement
        );


        messagesContainer.appendChild(
            messageElement
        );

    });


    // النزول لآخر رسالة
    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

}



// ==========================================
// إرسال رسالة
// ==========================================

messageForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!user) {
            return;
        }


        const message =
            messageInput.value.trim();


        if (!message) {
            return;
        }


        try {

            const response = await fetch(
                `${API_URL}/messages`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: user.name,

                        message: message

                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    "فشل إرسال الرسالة"
                );

            }


            // تفريغ مربع الكتابة
            messageInput.value = "";


            // تحميل الرسائل من جديد
            await loadMessages();


            // إعادة التركيز
            messageInput.focus();

        } catch (error) {

            console.error(
                "خطأ في إرسال الرسالة:",
                error
            );

            alert(
                "مش قادر أوصل للسيرفر"
            );

        }

    }
);



// ==========================================
// تحديث الرسائل تلقائيًا
// ==========================================

// كل 2 ثانية نشوف إذا فيه رسائل جديدة

setInterval(function () {

    if (user) {
        loadMessages();
    }

}, 2000);