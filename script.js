/* =========================================
   أبطال البكالوريا
   نسخة تجريبية
========================================= */


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

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const darkMode =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "darkMode",
        darkMode
    );

    themeBtn.textContent =
        darkMode ? "☀️" : "🌙";
});


if (localStorage.getItem("darkMode") === "true") {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";
}


/* =========================================
   ركن التلخيصات
========================================= */

function adminSummaryLogin() {

    const password =
        prompt("🔐 اكتب كلمة مرور صاحب المنصة:");

    /*
       كلمة المرور دي للتجربة فقط.
       في المنصة الحقيقية هنعمل تسجيل دخول آمن.
    */

    if (password === "05329") {

        document
            .getElementById("summaryAdmin")
            .classList.remove("hidden");

        alert("✅ تم تسجيل الدخول");

    } else {

        alert("❌ كلمة المرور غير صحيحة");
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

        alert("⚠️ اكتب اسم الملخص والمادة واختر ملفًا.");

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

            <h3>📄 ${escapeHTML(name)}</h3>

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

    addUpdate("📚 تم نشر ملخص جديد");
}


/* =========================================
   ركن الأسئلة
========================================= */

function questionAdminLogin() {

    const password =
        prompt("🔐 اكتب كلمة مرور الإدارة:");

    if (password === "55993") {

        document
            .getElementById("questionAdmin")
            .classList.remove("hidden");

        alert("✅ تم فتح لوحة إنشاء الأسئلة");

    } else {

        alert("❌ كلمة المرور غير صحيحة");
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

        alert("⚠️ لازم تكمل السؤال والاختيارات وتحدد الإجابة الصحيحة.");

        return;
    }


    const card =
        document.createElement("div");

    card.className = "question-card";


    let optionsHTML = "";


    options.forEach((option, index) => {

        optionsHTML += `

            <label class="option">

                <input
                    type="radio"
                    name="question-${Date.now()}"
                    value="${index}"
                >

                ${escapeHTML(option)}

            </label>
        `;
    });


    card.innerHTML = `

        <h2>
            ❓ ${escapeHTML(question)}
        </h2>

        ${optionsHTML}

        <button onclick="checkAnswer(this, ${correct})">
            ✅ تأكيد الإجابة
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

    addUpdate("❓ تم نشر سؤال جديد");
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

        result.textContent =
            "⚠️ اختار إجابة أولًا.";

        return;
    }


    if (
        Number(selected.value) ===
        Number(correctAnswer)
    ) {

        result.textContent =
            "🎉 إجابة صحيحة! أحسنت.";

    } else {

        result.textContent =
            "❌ إجابة غير صحيحة. حاول مرة أخرى.";
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

        alert("⚠️ اكتب اسم المشاركة واختر ملفًا.");

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

        alert("❌ نوع الملف غير مسموح به.");

        return;
    }


    const url =
        URL.createObjectURL(file);


    const card =
        document.createElement("div");

    card.className = "file-card";


    card.innerHTML = `

        <div>

            <h3>🤝 ${escapeHTML(title)}</h3>

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


    addUpdate("🤝 تمت إضافة مشاركة جديدة");
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
            👨‍🎓 طالب
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

function addUpdate(text) {

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
                ${escapeHTML(text)}
            </strong>

        </div>

        <small>
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