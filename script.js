/* =========================================
   أبطال البكالوريا
   نسخة تجريبية
========================================= */


/* =========================================
   الأيقونات (SVG)
========================================= */

function icon(name, className) {

    const cls = className
        ? `icon ${className}`
        : "icon";

    return `
        <svg
            class="${cls}"
            aria-hidden="true"
        >
            <use href="#i-${name}"/>
        </svg>
    `;
}


/* =========================================
   التنبيهات (بدل alert)
========================================= */

const TOAST_ICONS = {

    success: "check",

    error: "x",

    warn: "warning",

    info: "chat"
};


function notify(message, type = "info") {

    const host =
        document.getElementById("toastHost");

    if (!host) {
        return;
    }


    const toast =
        document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML =
        icon(TOAST_ICONS[type] || "chat") +
        `<span>${message}</span>`;


    host.appendChild(toast);


    requestAnimationFrame(() => {
        toast.classList.add("show");
    });


    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => toast.remove(), 300);

    }, 3200);
}


/* =========================================
   نافذة كلمة المرور (بدل prompt)
========================================= */

function askPassword(title) {

    return new Promise(resolve => {

        const backdrop =
            document.getElementById("pwModal");

        const input =
            document.getElementById("pwInput");

        const okBtn =
            document.getElementById("pwOk");

        const cancelBtn =
            document.getElementById("pwCancel");


        document.getElementById("pwTitle").textContent =
            title;


        const close = value => {

            backdrop.classList.remove("open");

            okBtn.removeEventListener("click", submit);

            cancelBtn.removeEventListener("click", cancel);

            input.removeEventListener("keydown", onKey);

            document.removeEventListener("keydown", onDocKey);

            resolve(value);
        };


        const submit = () => close(input.value);

        const cancel = () => close(null);


        const onKey = event => {

            if (event.key === "Enter") {

                event.preventDefault();

                submit();
            }
        };


        const onDocKey = event => {

            if (event.key === "Escape") {
                cancel();
            }
        };


        okBtn.addEventListener("click", submit);

        cancelBtn.addEventListener("click", cancel);

        input.addEventListener("keydown", onKey);

        document.addEventListener("keydown", onDocKey);


        input.value = "";

        backdrop.classList.add("open");

        setTimeout(() => input.focus(), 60);
    });
}


/* =========================================
   التنقل بين الصفحات
========================================= */

function openPage(pageId) {

    document.getElementById("homePage").style.display = "none";

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    window.scrollTo(0, 0);
}


function goHome() {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById("homePage").style.display = "block";

    window.scrollTo(0, 0);
}


/* =========================================
   الوضع الليلي
========================================= */

const themeBtn = document.getElementById("themeBtn");


function setThemeIcon() {

    const darkMode =
        document.body.classList.contains("dark");

    themeBtn.innerHTML =
        icon(darkMode ? "sun" : "moon");
}


themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const darkMode =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "darkMode",
        darkMode
    );

    setThemeIcon();
});


if (localStorage.getItem("darkMode") === "true") {

    document.body.classList.add("dark");
}


setThemeIcon();


/* =========================================
   ركن التلخيصات
========================================= */

async function adminSummaryLogin() {

    const password =
        await askPassword("دخول صاحب المنصة");


    /*
       كلمة المرور دي للتجربة فقط.
       في المنصة الحقيقية هنعمل تسجيل دخول آمن.
    */

    if (password === null) {
        return;
    }


    if (password === "05329") {

        document
            .getElementById("summaryAdmin")
            .classList.remove("hidden");

        notify("تم تسجيل الدخول", "success");

    } else {

        notify("كلمة المرور غير صحيحة", "error");
    }
}


function publishSummary() {

    const name =
        document.getElementById("summaryName").value.trim();

    const subject =
        document.getElementById("summarySubject").value.trim();

    const fileInput =
        document.getElementById("summaryFile");

    if (!name || !subject || !fileInput.files[0]) {

        notify("اكتب اسم الملخص والمادة واختر ملفًا.", "warn");

        return;
    }


    const file = fileInput.files[0];

    const url =
        URL.createObjectURL(file);


    const card =
        document.createElement("div");

    card.className = "file-card";

    card.innerHTML = `

        <div>

            <h3>
                ${icon("doc")}
                ${escapeHTML(name)}
            </h3>

            <small>
                المادة: ${escapeHTML(subject)}
            </small>

        </div>

        <a
            href="${url}"
            target="_blank"
        >
            فتح الملف
        </a>
    `;


    const list =
        document.getElementById("summaryList");

    const empty =
        list.querySelector(".empty");

    if (empty) {
        empty.remove();
    }

    list.prepend(card);


    document.getElementById("summaryName").value = "";
    document.getElementById("summarySubject").value = "";
    fileInput.value = "";

    addUpdate("book", "تم نشر ملخص جديد");
}


/* =========================================
   ركن الأسئلة
========================================= */

async function questionAdminLogin() {

    const password =
        await askPassword("دخول الإدارة");


    if (password === null) {
        return;
    }


    if (password === "55993") {

        document
            .getElementById("questionAdmin")
            .classList.remove("hidden");

        notify("تم فتح لوحة إنشاء الأسئلة", "success");

    } else {

        notify("كلمة المرور غير صحيحة", "error");
    }
}


function publishQuestion() {

    const question =
        document.getElementById("questionText")
        .value
        .trim();

    const options = [

        document.getElementById("option1").value.trim(),

        document.getElementById("option2").value.trim(),

        document.getElementById("option3").value.trim(),

        document.getElementById("option4").value.trim()

    ];


    const correct =
        document.getElementById("correctAnswer").value;


    if (
        !question ||
        options.some(option => !option) ||
        correct === ""
    ) {

        notify(
            "لازم تكمل السؤال والاختيارات وتحدد الإجابة الصحيحة.",
            "warn"
        );

        return;
    }


    const card =
        document.createElement("div");

    card.className = "question-card";


    const questionId = `question-${Date.now()}`;

    let optionsHTML = "";


    options.forEach((option, index) => {

        optionsHTML += `

            <label class="option">

                <input
                    type="radio"
                    name="${questionId}"
                    value="${index}"
                >

                <span>${escapeHTML(option)}</span>

            </label>
        `;
    });


    card.innerHTML = `

        <h2>
            ${icon("question")}
            <span>${escapeHTML(question)}</span>
        </h2>

        ${optionsHTML}

        <button onclick="checkAnswer(this, ${correct})">
            ${icon("check")}
            تأكيد الإجابة
        </button>

        <div class="result"></div>
    `;


    document
        .getElementById("questionList")
        .prepend(card);


    document.getElementById("questionText").value = "";

    document.getElementById("option1").value = "";
    document.getElementById("option2").value = "";
    document.getElementById("option3").value = "";
    document.getElementById("option4").value = "";

    document.getElementById("correctAnswer").value = "";

    addUpdate("question", "تم نشر سؤال جديد");
}


function checkAnswer(button, correctAnswer) {

    const card =
        button.closest(".question-card");

    const selected =
        card.querySelector(
            'input[type="radio"]:checked'
        );

    const result =
        card.querySelector(".result");


    if (!selected) {

        result.className = "result is-warn";

        result.innerHTML =
            icon("warning") +
            "<span>اختار إجابة أولًا.</span>";

        return;
    }


    if (
        Number(selected.value) ===
        Number(correctAnswer)
    ) {

        result.className = "result is-ok";

        result.innerHTML =
            icon("party") +
            "<span>إجابة صحيحة! أحسنت.</span>";

    } else {

        result.className = "result is-bad";

        result.innerHTML =
            icon("x") +
            "<span>إجابة غير صحيحة. حاول مرة أخرى.</span>";
    }
}


/* =========================================
   فيد غيرك
========================================= */

function publishSharedFile() {

    const title =
        document.getElementById("shareTitle")
        .value
        .trim();

    const fileInput =
        document.getElementById("shareFile");


    if (!title || !fileInput.files[0]) {

        notify("اكتب اسم المشاركة واختر ملفًا.", "warn");

        return;
    }


    const file =
        fileInput.files[0];


    const allowedTypes = [

        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "application/vnd.ms-powerpoint",

        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        "application/vnd.ms-excel",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "text/plain",

        "image/jpeg",

        "image/png",

        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        notify("نوع الملف غير مسموح به.", "error");

        return;
    }


    const url =
        URL.createObjectURL(file);


    const card =
        document.createElement("div");

    card.className = "file-card";


    card.innerHTML = `

        <div>

            <h3>
                ${icon("users")}
                ${escapeHTML(title)}
            </h3>

            <small>
                تمت المشاركة الآن
            </small>

        </div>

        <a
            href="${url}"
            target="_blank"
        >
            فتح
        </a>
    `;


    const list =
        document.getElementById("sharedList");


    const empty =
        list.querySelector(".empty");

    if (empty) {
        empty.remove();
    }


    list.prepend(card);


    document.getElementById("shareTitle").value = "";

    fileInput.value = "";


    addUpdate("users", "تمت إضافة مشاركة جديدة");
}


/* =========================================
   الشات
========================================= */

function sendMessage() {

    const input =
        document.getElementById("chatInput");

    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    const message =
        document.createElement("div");

    message.className =
        "message sent";


    message.innerHTML = `

        <span class="message-name">
            ${icon("user")}
            طالب
        </span>

        <p>
            ${escapeHTML(text)}
        </p>
    `;


    const chat =
        document.getElementById("chatMessages");


    chat.appendChild(message);


    input.value = "";


    chat.scrollTop =
        chat.scrollHeight;
}


/* =========================================
   آخر التحديثات
========================================= */

function addUpdate(iconName, text) {

    const list =
        document.getElementById("updatesList");


    const empty =
        list.querySelector(".empty");

    if (empty) {
        empty.remove();
    }


    const item =
        document.createElement("div");

    item.className =
        "file-card";


    item.innerHTML = `

        <div>

            <strong>
                ${icon(iconName)}
                ${escapeHTML(text)}
            </strong>

        </div>

        <small>
            ${icon("clock")}
            الآن
        </small>
    `;


    list.prepend(item);
}


/* =========================================
   حماية بسيطة للنصوص
========================================= */

function escapeHTML(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
