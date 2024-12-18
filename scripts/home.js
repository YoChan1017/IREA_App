document.addEventListener("DOMContentLoaded", () => {
    console.log("home.js script loaded and DOM fully parsed");

    const logoutButton = document.getElementById("logoutButton");
    console.log("Logout button found:", logoutButton);

    logoutButton.addEventListener("click", () => {
        console.log("Logout button clicked, redirecting to loginPage.html");
        window.location.href = "loginPage.html";
    });
});
