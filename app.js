// ==========================================
// إعدادات التطبيق
// ==========================================

// أثناء التطوير على جهازك
const API_URL = "https://my-chat-production-2f53.up.railway.app";

// لما نرفع الـBackend على الإنترنت هنغير السطر
// فوق فقط إلى رابط السيرفر الحقيقي.

const SESSION_KEY = "myChatUser";



// ==========================================
// عناصر الصفحة
// ==========================================

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const loginUsernameInput = document.getElementById("loginUsername");
const loginPasswordInput = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

const registerForm = document.getElementById("registerForm");
const registerUsernameInput = document.getElementById("registerUsername");
const registerPasswordInput = document.getElementById("registerPassword");
const registerError = document.getElementById("registerError");

const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");

const currentUser = document.getElementById("currentUser");
const logoutButton = document.getElementById("logoutButton");

const messagesContainer = document.getElementById("messages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");



// ==========================================
// بيانات المستخدم الحالي
// ==========================================

let user = null;

let refreshInterval = null;



// ==========================================
// التبديل بين شاشة الدخول وإنشاء الحساب
// ==========================================

showRegisterLink.addEventListener("click", function (event) {

    event.preventDefault();

    loginForm.hidden = true;
    registerForm.hidden = false;

    loginError.textContent = "";
    registerError.textContent = "";

});


showLoginLink.addEventListener("click", function (event) {

    event.preventDefault();

    registerForm.hidden = true;
    loginForm.hidden = false;

    loginError.textContent = "";
    registerError.textContent = "";

});



// ==========================================
// حفظ / قراءة / مسح الجلسة
// ==========================================

function saveSession(userData) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(userData)
    );

}


function readSession() {

    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
        return null;
    }

    try {

        return JSON.parse(raw);

    } catch (error) {

        return null;

    }

}


function clearSession() {

    localStorage.removeItem(SESSION_KEY);

}



// ==========================================
// الدخول للشات بعد نجاح تسجيل الدخول/الحساب
// ==========================================

async function enterChat(userData) {

    // لازم يكون فيه token جاي من السيرفر
    // (لو فيه جلسة قديمة متخزنة من غير token، نرفضها)
    if (!userData || !userData.token) {

        clearSession();

        loginError.textContent =
            "لازم تسجل دخولك تاني";

        return;

    }

    user = userData;

    saveSession(user);

    loginScreen.hidden = true;
    chatScreen.hidden = false;

    currentUser.textContent = `أنت: ${user.name}`;

    await loadMessages();

    messageInput.focus();

    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(function () {

        if (user) {
            loadMessages();
        }

    }, 2000);

}



// ==========================================
// تسجيل الدخول
// ==========================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!name || !password) {
        loginError.textContent = "اكتب اسمك وكلمة المرور";
        return;
    }

    loginError.textContent = "";

    try {

        const response = await fetch(`${API_URL}/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                password: password
            })

        });

        const data = await response.json();

        if (!response.ok) {
            loginError.textContent =
                data.error || "فشل تسجيل الدخول";
            return;
        }

        loginPasswordInput.value = "";

        await enterChat(data);

    } catch (error) {

        console.error(error);

        loginError.textContent =
            "حصلت مشكلة في الاتصال بالسيرفر";

    }

});



// ==========================================
// إنشاء حساب جديد
// ==========================================

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value;

    if (!name || !password) {
        registerError.textContent = "اكتب اسمك وكلمة المرور";
        return;
    }

    if (password.length < 4) {
        registerError.textContent =
            "كلمة المرور لازم تكون 4 حروف على الأقل";
        return;
    }

    registerError.textContent = "";

    try {

        const response = await fetch(`${API_URL}/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                password: password
            })

        });

        const data = await response.json();

        if (!response.ok) {
            registerError.textContent =
                data.error || "فشل إنشاء الحساب";
            return;
        }

        registerPasswordInput.value = "";

        await enterChat(data);

    } catch (error) {

        console.error(error);

        registerError.textContent =
            "حصلت مشكلة في الاتصال بالسيرفر";

    }

});



// ==========================================
// تسجيل الخروج
// ==========================================

logoutButton.addEventListener("click", function () {

    // نبلّغ السيرفر إنه يلغي الـtoken (من غير ما ننتظر الرد)
    if (user && user.token) {

        fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${user.token}`
            }
        }).catch(function () {});

    }

    user = null;

    clearSession();

    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    chatScreen.hidden = true;
    loginScreen.hidden = false;

    registerForm.hidden = true;
    loginForm.hidden = false;

    loginUsernameInput.value = "";
    loginPasswordInput.value = "";

    messagesContainer.innerHTML = "";

});



// ==========================================
// تحميل الرسائل
// ==========================================

async function loadMessages() {

    try {

        if (!user || !user.token) {
            return;
        }

        const response = await fetch(
            `${API_URL}/messages`,
            {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            }
        );

        if (response.status === 401) {
            logoutButton.click();
            return;
        }

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
                            "application/json",

                        // بنبعت الـtoken عشان السيرفر
                        // يتأكد إحنا فعلاً مين
                        "Authorization":
                            `Bearer ${user.token}`
                    },

                    body: JSON.stringify({

                        message: message

                        // ملحوظة: مبقناش نبعت "name" من هنا
                        // خالص، السيرفر هو اللي هياخد الاسم
                        // من الـtoken نفسه عشان محدش يقدر
                        // ينتحل شخصية حد تاني

                    })

                }
            );


            // لو الـtoken غلط أو خلصت صلاحيته، نرجّعه
            // لشاشة الدخول تاني
            if (response.status === 401) {

                logoutButton.click();

                alert(
                    "جلستك خلصت، سجل دخولك تاني"
                );

                return;

            }


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
// لو فيه جلسة محفوظة، ادخل الشات على طول
// ==========================================

(function initSession() {

    const savedUser = readSession();

    if (savedUser && savedUser.name) {
        enterChat(savedUser);
    }

})();
