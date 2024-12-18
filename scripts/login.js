const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("loginButton");
    const errorDialog = document.getElementById("errorDialog");
    const errorMessage = document.getElementById("errorMessage");
    const closeDialog = document.getElementById("closeDialog");

    // 다이얼로그 닫기 버튼 이벤트
    closeDialog.addEventListener("click", () => {
        errorDialog.style.display = "none"; // 다이얼로그 닫기
    });

    // 로그인 버튼 클릭 이벤트
    loginButton.addEventListener("click", () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        ipcRenderer.send("login-attempt", { username, password });

        ipcRenderer.removeAllListeners("login-response");

        ipcRenderer.on("login-response", (event, response) => {
            if (response.success) {
                window.location.href = "homePage.html";
            } else {
                // 다이얼로그 열기
                errorMessage.textContent = response.error;
                errorDialog.style.display = "block";

                // 입력 필드 초기화 (선택 사항)
                document.getElementById("username").value = "";
                document.getElementById("password").value = "";
            }
        });
    });
});
