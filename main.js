const { app, BrowserWindow, ipcMain } = require("electron");    // Electron
const sqlite3 = require("sqlite3").verbose();                   // SQLite3
const iconv = require("iconv-lite");                            // iconv-lite

const path = require('path');
const iconPath = path.join(__dirname, 'static/icons/app-icon.ico');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1160, // 창 너비
        height: 680, // 창 높이
        icon: iconPath, // 아이콘 경로 설정
        webPreferences: {
            nodeIntegration: true, // Node.js 통합 활성화
            contextIsolation: false, // 컨텍스트 격리 비활성화
        },
        resizable: true, // 창 크기 조절 가능
    });
    
    console.log('Current directory:', __dirname);
    console.log('Icon path:', path.join(__dirname, 'static/icons/app-icon.ico'));
    
    // 초기 페이지: 로그인 페이지
    mainWindow.loadFile("static/loginPage.html");

    // Zoom 조정 이벤트 (배율 축소)
    mainWindow.webContents.setZoomFactor(0.65); // 70%로 축소
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.setZoomFactor(0.65); // 다시 Zoom 설정
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 로그인 이벤트 처리
ipcMain.on("login-attempt", (event, { username, password }) => {
    console.log("Login attempt received:", { username, password }); // 디버깅 로그 추가

    const db = new sqlite3.Database("./database/membership.db", (err) => {
        if (err) {
            console.error("Database connection error:", err.message);
        } else {
            console.log("Connected to the database.");
        }
    });

    db.get(
        "SELECT * FROM USER WHERE irea_id = ? AND irea_pw = ?",
        [username, password],
        (err, row) => {
            if (err) {
                console.error("Database error:", err.message);
                event.reply("login-response", { success: false, error: "Database error" });
            } else if (row) {
                // console.log("Original name:", row.name);
                // row.name = Buffer.from(row.name, "binary").toString("utf-8"); // UTF-8로 강제 디코딩
                console.log("Login successful for user:", row);
                event.reply("login-response", { success: true });
            } else {
                console.log("Invalid credentials for:", { username });
                event.reply("login-response", { success: false, error: "올바른 정보를 입력해주세요." });
            }
        }
    );

    db.close();
});

// 직원 관리 이벤트 처리
ipcMain.on("fetch-managers", (event) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.all("SELECT * FROM USER WHERE role IN ('ADMIN', 'USER')", (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            event.reply("managers-data", []); // 빈 데이터 반환
        } else {
            console.log("Fetched managers:", rows); // 가져온 데이터 로그 출력
            event.reply("managers-data", rows); // 데이터를 렌더링용으로 전송
        }
    });

    db.close();
});
ipcMain.on("edit-manager", (event, { id, name, role, password }) => {
    const db = new sqlite3.Database("./database/membership.db");
    console.log(`Editing manager: ID=${id}, Name=${name}, Role=${role}`); // 로그 추가
    db.run(
        "UPDATE USER SET name = ?, role = ?, irea_pw = ? WHERE user_id = ?",
        [name, role, password, id],
        (err) => {
            if (err) {
                console.error("Edit manager error:", err.message);
            } else {
                event.reply("refresh-managers");
            }
        }
    );
    db.close();
});
ipcMain.on("delete-manager", (event, id) => {
    const db = new sqlite3.Database("./database/membership.db");
    db.run("DELETE FROM USER WHERE user_id = ?", [id], (err) => {
        if (err) {
            console.error("Delete manager error:", err.message);
        } else {
            event.reply("refresh-managers");
        }
    });
    db.close();
});

// 프로 관리 이벤트 처리
ipcMain.on("fetch-pros", (event) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.all("SELECT * FROM PRO", (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            event.reply("pros-data", []);
        } else {
            console.log("Fetched pros:", rows); // 데이터 디버깅용
            event.reply("pros-data", rows);
        }
    });

    db.close();
});
ipcMain.on("add-pro", (event, { pro_name }) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.run("INSERT INTO PRO (pro_name) VALUES (?)", [pro_name], (err) => {
        if (err) {
            console.error("Add pro error:", err.message);
        } else {
            event.reply("refresh-pros");
        }
    });

    db.close();
});
ipcMain.on("edit-pro", (event, { pro_id, pro_name }) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.run("UPDATE PRO SET pro_name = ? WHERE pro_id = ?", [pro_name, pro_id], (err) => {
        if (err) {
            console.error("Edit pro error:", err.message);
        } else {
            event.reply("refresh-pros");
        }
    });

    db.close();
});
ipcMain.on("delete-pro", (event, pro_id) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.run("DELETE FROM PRO WHERE pro_id = ?", [pro_id], (err) => {
        if (err) {
            console.error("Delete pro error:", err.message);
        } else {
            console.log("Deleted pro with ID:", pro_id);
            event.reply("refresh-pros");
        }
    });

    db.close();
});

// 회원 신청 이벤트 처리
ipcMain.on("add-golf-member", (event, data) => {
    console.log("Attempting to insert:", data);

    const db = new sqlite3.Database("./database/membership.db");

    db.run(
        `
        INSERT INTO GOLF (
            name, male, b_day, p_num, s_day, r_day, f_day, lesson, pro_id, payment, price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.name,
            data.gender === "male" ? "M" : "F",
            data.birthDate,
            data.phone,
            data.startDate,
            data.months,
            data.expiryDate,
            data.lesson ? "Y" : "N",
            data.proId,
            data.payment,
            data.price,
        ],
        (err) => {
            if (err) {
                console.error("SQL Error:", err.message);
                event.reply("member-added-error", err.message);
            } else {
                console.log("Insertion successful for:", data.name);
                event.reply("member-added");
            }
        }
    );

    db.close();
});

// 회원 정보 확인 이벤트 처리
ipcMain.on("fetch-golf-data", (event) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.all(
        `
        SELECT 
            GOLF.golf_id,
            GOLF.name,
            GOLF.male,
            GOLF.b_day,
            GOLF.p_num,
            GOLF.s_day,
            GOLF.r_day,
            GOLF.f_day,
            GOLF.payment,
            GOLF.price,
            PRO.pro_name
        FROM GOLF
        LEFT JOIN PRO ON GOLF.pro_id = PRO.pro_id;
        `,
        (err, rows) => {
            if (err) {
                console.error("Error fetching GOLF data:", err.message);
                event.reply("golf-data-response", []); // 오류 발생 시 빈 데이터 반환
            } else {
                console.log("Fetched GOLF data:", rows); // 디버깅용 로그
                event.reply("golf-data-response", rows); // 데이터를 렌더링용으로 전송
            }
        }
    );

    db.close();
});
ipcMain.on("delete-golf-member", (event, golfId) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.run(
        "DELETE FROM GOLF WHERE golf_id = ?",
        [golfId],
        (err) => {
            if (err) {
                console.error("Error deleting GOLF member:", err.message);
                event.reply("golf-delete-error", err.message); // 삭제 실패 시 응답
            } else {
                console.log("Deleted GOLF member with ID:", golfId);
                event.reply("golf-delete-success", golfId); // 삭제 성공 시 응답
            }
        }
    );

    db.close();
});
ipcMain.on("fetch-single-golf", (event, golfId) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.get(
        `
        SELECT 
            GOLF.golf_id,
            GOLF.name,
            GOLF.male,
            GOLF.b_day,
            GOLF.p_num,
            GOLF.s_day,
            GOLF.r_day,
            GOLF.f_day,
            GOLF.payment,
            GOLF.price,
            GOLF.pro_id,
            PRO.pro_name
        FROM GOLF
        LEFT JOIN PRO ON GOLF.pro_id = PRO.pro_id
        WHERE GOLF.golf_id = ?;
        `,
        [golfId],
        (err, row) => {
            if (err) {
                console.error("Error fetching member data:", err.message);
                event.reply("single-golf-response", null);
            } else {
                console.log("Fetched member:", row);
                event.reply("single-golf-response", row);
            }
        }
    );

    db.close();
});
ipcMain.on("edit-golf-member", (event, member) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.run(
        `
        UPDATE GOLF
        SET name = ?, male = ?, b_day = ?, p_num = ?, s_day = ?, r_day = ?, f_day = ?, pro_id = ?, price = ?
        WHERE golf_id = ?;
        `,
        [
            member.name,
            member.male,
            member.b_day,
            member.p_num,
            member.s_day,
            member.r_day,
            calculateExpiryDate(member.s_day, member.r_day),
            member.pro_id,
            member.price,
            member.id,
        ],
        (err) => {
            if (err) {
                console.error("Error updating GOLF member:", err.message);
            } else {
                console.log("Updated member with ID:", member.id);
                event.reply("golf-update-success", member.id); // 수정 성공 응답
            }
        }
    );

    db.close();
});
function calculateExpiryDate(startDate, months) {   // 등록기간에 따른 만료일 계산 함수   
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + months);
    return start.toISOString().split("T")[0];       // "YYYY-MM-DD" 형식 반환
}
ipcMain.on("fetch-filtered-golf-data", (event, filters) => {
    const db = new sqlite3.Database("./database/membership.db");

    let query = `
        SELECT 
            GOLF.golf_id,
            GOLF.name,
            GOLF.male,
            GOLF.b_day,
            GOLF.p_num,
            GOLF.s_day,
            GOLF.r_day,
            GOLF.f_day,
            GOLF.payment,
            GOLF.price,
            PRO.pro_name
        FROM GOLF
        LEFT JOIN PRO ON GOLF.pro_id = PRO.pro_id
        WHERE 1=1
    `;

    const params = [];

    if (filters.name) {
        query += " AND GOLF.name LIKE ?";
        params.push(`%${filters.name}%`);
    }
    if (filters.gender) {
        query += " AND GOLF.male = ?";
        params.push(filters.gender === "male" ? "M" : "F");
    }
    if (filters.pro_id) {
        query += " AND GOLF.pro_id = ?";
        params.push(filters.pro_id);
    }
    if (filters.duration) {
        query += " AND GOLF.r_day = ?";
        params.push(filters.duration);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Error fetching filtered GOLF data:", err.message);
            event.reply("filtered-golf-data-response", []);
        } else {
            console.log("Filtered GOLF data fetched:", rows);
            event.reply("filtered-golf-data-response", rows);
        }
    });

    db.close();
});

// 라커 관리 이벤트 처리
ipcMain.on("search-golf-members", (event, query) => {
    const db = new sqlite3.Database("./database/membership.db");

    let sql = `
        SELECT golf_id, name, male, b_day, p_num
        FROM GOLF
        WHERE name LIKE ?
    `;

    db.all(sql, [`%${query}%`], (err, rows) => {
        if (err) {
            console.error("Error fetching golf members:", err.message);
            event.reply("search-golf-members-response", []);
        } else {
            event.reply("search-golf-members-response", rows);
        }
    });

    db.close();
});
ipcMain.on("register-locker", (event, lockerData) => {
    const db = new sqlite3.Database("./database/membership.db");

    db.run(
        `INSERT INTO LOCKER (l_num, golf_id, s_day, r_day, f_day, price, payment) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            lockerData.locker_number, // 라커 번호
            lockerData.golf_id,       // 회원 ID
            lockerData.start_date,    // 시작일
            lockerData.months,        // 등록 기간
            lockerData.expiry_date,   // 만료일
            lockerData.price,         // 금액
            lockerData.payment,       // 결제 방법
        ],
        (err) => {
            if (err) {
                console.error("Locker Registration Failed:", err.message);
                event.reply("register-locker-fail");
            } else {
                console.log("Locker Registered Successfully.");
                event.reply("register-locker-success");
            }
        }
    );

    db.close();
});
ipcMain.on("fetch-locker-data", (event) => {
    const db = new sqlite3.Database("./database/membership.db");

    const query = `
        SELECT 
            LOCKER.l_num, LOCKER.s_day, LOCKER.r_day, LOCKER.f_day, 
            LOCKER.price, LOCKER.payment, GOLF.name
        FROM LOCKER
        LEFT JOIN GOLF ON LOCKER.golf_id = GOLF.golf_id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching locker data:", err.message);
            event.reply("fetch-locker-response", []);
        } else {
            event.reply("fetch-locker-response", rows);
        }
    });

    db.close();
});
ipcMain.on("check-locker-availability", (event, golfId) => {
    const db = new sqlite3.Database("./database/membership.db");

    const query = "SELECT 1 FROM LOCKER WHERE golf_id = ?";
    db.get(query, [golfId], (err, row) => {
        if (err) {
            console.error("Error checking locker availability:", err.message);
            event.reply("locker-availability-response", false); // 오류 발생 시 등록 불가로 반환
        } else {
            event.reply("locker-availability-response", !row); // 등록된 데이터 없으면 true
        }
    });

    db.close();
});
// ------------------------------------------------------------------------------
