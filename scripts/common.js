// common.js
document.addEventListener("DOMContentLoaded", () => {
    ipcRenderer.send("check-login");

    ipcRenderer.on("login-check-response", (event, response) => {
        if (!response.loggedIn) {
            location.href = "loginPage.html";
        }
    });
});
