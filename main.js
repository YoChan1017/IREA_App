const { app, BrowserWindow, ipcMain, dialog } = require("electron");    // Electron
const sqlite3 = require("sqlite3").verbose();                           // SQLite3
const iconv = require("iconv-lite");                                    // iconv-lite

const fs = require("fs");
const path = require('path');

let mainWindow;

// 개발 환경 및 static 경로 설정
const isDev = !app.isPackaged;
const staticPath = isDev
    ? path.join(__dirname, "static") // 개발 환경
    : path.join(process.resourcesPath, "static"); // 배포 환경

// 데이터베이스 경로 설정
const dbPath = isDev
    ? path.join(__dirname, "database/membership.db") // 개발 환경
    : path.join(app.getPath("userData"), "membership.db"); // 배포 환경

// 데이터베이스 파일 복사
if (!fs.existsSync(dbPath)) {
    const sourceDbPath = path.join(__dirname, "database/membership.db");
    if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
        console.log("Database copied to:", dbPath);
    } else {
        console.error("Source database file not found:", sourceDbPath);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1160, // 창 너비
        height: 680, // 창 높이
        icon: path.join(staticPath, "icons/app-icon.ico"), // 아이콘 경로
        webPreferences: {
            nodeIntegration: true, // Node.js 통합 활성화
            contextIsolation: false, // 컨텍스트 격리 비활성화
        },
        resizable: true, // 창 크기 조절 가능
    });

    console.log('Current directory:', __dirname);
    console.log('Icon path:', path.join(__dirname, 'icons/app-icon.ico'));
    
    // 초기 페이지: 로그인 페이지
    mainWindow.loadFile(path.join(__dirname, "static/loginPage.html"));

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
let loggedInUser = null; // 로그인된 사용자 정보

ipcMain.on("login-attempt", (event, { username, password }) => {
    const db = new sqlite3.Database(dbPath);

    db.get(
        "SELECT * FROM USER WHERE irea_id = ? AND irea_pw = ?",
        [username, password],
        (err, row) => {
            if (err) {
                event.reply("login-response", { success: false, error: "Database error" });
            } else if (row) {
                loggedInUser = {
                    id: row.user_id,
                    name: row.name,
                    role: row.role,
                };
                event.reply("login-response", { success: true });
            } else {
                event.reply("login-response", { success: false, error: "Invalid credentials" });
            }
        }
    );

    db.close();
});
ipcMain.on("logout", (event) => {
    loggedInUser = null; // 로그인 정보 초기화
    event.reply("logout-success");
});
ipcMain.on("fetch-logged-in-user", (event) => {
    if (loggedInUser) {
        event.reply("logged-in-user-response", loggedInUser);
    } else {
        event.reply("logged-in-user-response", null);
    }
});
ipcMain.on("check-login", (event) => {
    if (loggedInUser) {
        event.reply("login-check-response", { loggedIn: true });
    } else {
        event.reply("login-check-response", { loggedIn: false });
    }
});

// 메인 페이지 이벤트 처리
ipcMain.on("fetch-home-data", (event) => {
    const db = new sqlite3.Database(dbPath);

    db.get(
        `SELECT 
            (SELECT COUNT(*) FROM GOLF) AS member_count,
            (SELECT COUNT(*) FROM LOCKER WHERE golf_id IS NOT NULL) AS occupied_lockers,
            (SELECT COUNT(*) FROM LOCKER) AS total_lockers,
            (SELECT COUNT(*) FROM GOLF WHERE f_day < DATE('now')) AS expired_members,
            (SELECT COUNT(*) FROM LOCKER WHERE f_day < DATE('now')) AS expired_lockers
        `,
        (err, row) => {
            if (err) {
                console.error("Error fetching home data:", err.message);
                event.reply("home-data-response", { error: err.message });
            } else {
                event.reply("home-data-response", {
                    memberCount: row.member_count,
                    occupiedLockers: row.occupied_lockers,
                    totalLockers: row.total_lockers,
                    expiredMembers: row.expired_members,
                    expiredLockers: row.expired_lockers,
                });
            }
        }
    );

    db.close();
});

// 직원 관리 이벤트 처리
ipcMain.on("fetch-managers", (event) => {
    const db = new sqlite3.Database(dbPath);

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
ipcMain.on("edit-manager", (event, { id, name, password }) => {
    const db = new sqlite3.Database(dbPath);
    console.log(`Editing manager: ID=${id}, Name=${name}`); // 로그 추가
    db.run(
        "UPDATE USER SET name = ?, irea_pw = ? WHERE user_id = ?",
        [name, password, id],
        (err) => {
            if (err) {
                console.error("Edit manager error:", err.message);
                event.reply("edit-manager-fail", err.message);
            } else {
                console.log(`Manager ID=${id} updated successfully.`);
                event.reply("edit-manager-success");
            }
        }
    );
    db.close();
});
ipcMain.on("delete-manager", (event, id) => {
    const db = new sqlite3.Database(dbPath);
    db.run("DELETE FROM USER WHERE user_id = ?", [id], (err) => {
        if (err) {
            console.error("Delete manager error:", err.message);
        } else {
            event.reply("refresh-managers");
        }
    });
    db.close();
});
ipcMain.on("add-manager", (event, { name, ireaId, password, role }) => {
    const db = new sqlite3.Database(dbPath);

    const query = `
        INSERT INTO USER (irea_id, irea_pw, name, role)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [ireaId, password, name, role], (err) => {
        if (err) {
            console.error("Error adding manager:", err.message);
            event.reply("add-manager-fail", err.message);
        } else {
            console.log("Manager added successfully.");
            event.reply("add-manager-success");
        }
    });

    db.close();
});


// 프로 관리 이벤트 처리
ipcMain.on("fetch-pros", (event) => {
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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

    const db = new sqlite3.Database(dbPath);

    // 중복 검사: 이름, 생일, 성별
    db.get(
        `SELECT * FROM GOLF WHERE name = ? AND b_day = ? AND male = ?`,
        [data.name, data.birthDate, data.gender === "male" ? "M" : "F"],
        (err, row) => {
            if (err) {
                console.error("SQL Error:", err.message);
                event.reply("member-added-error", err.message);
            } else if (row) {
                console.log("Duplicate member found:", row);
                event.reply("member-added-duplicate", {
                    name: data.name,
                    birthDate: data.birthDate,
                    gender: data.gender,
                });
            } else {
                // 중복되지 않은 경우 추가
                db.run(
                    `INSERT INTO GOLF (
                        name, male, b_day, p_num, s_day, r_day, f_day, lesson, pro_id, payment, price
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            }
        }
    );

    db.close();
});

// 회원 정보 확인 이벤트 처리
ipcMain.on("fetch-golf-data", (event) => {
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

    // 외래 키 활성화
    db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
            console.error("Failed to enable foreign keys:", err.message);
        }
    });

    // GOLF 데이터 삭제
    db.run(
        "DELETE FROM GOLF WHERE golf_id = ?",
        [golfId],
        function (err) {
            if (err) {
                console.error("Error deleting GOLF member:", err.message);
                event.reply("golf-delete-error", err.message);
            } else {
                console.log(`Deleted GOLF member with ID: ${golfId}`);
                event.reply("golf-delete-success", golfId); // GOLF 삭제만 응답
            }
        }
    );

    db.close();
});
ipcMain.on("fetch-single-golf", (event, golfId) => {
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
ipcMain.on("download-csv", async (event) => {
    const db = new sqlite3.Database(dbPath);

    const { canceled, filePath } = await dialog.showSaveDialog({
        title: "CSV 파일 저장",
        defaultPath: "golf_members.csv",
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
    });

    if (canceled) {
        event.reply("csv-download-cancel", "저장이 취소되었습니다.");
        return;
    }

    db.all(
        `SELECT GOLF.golf_id, GOLF.name, GOLF.male, GOLF.b_day, GOLF.p_num,
                GOLF.s_day, GOLF.r_day, GOLF.f_day, GOLF.payment, GOLF.price, PRO.pro_name
         FROM GOLF
         LEFT JOIN PRO ON GOLF.pro_id = PRO.pro_id`,
        [],
        (err, rows) => {
            if (err) {
                event.reply("csv-download-error", "데이터를 가져오는 데 실패했습니다.");
                return;
            }

            const csvRows = [
                "ID,이름,성별,생년월일,전화번호,시작일,등록기간(개월),만료일,결제정보,가격,프로정보",
            ];

            const formatDate = (date) => {
                const d = new Date(date);
                return isNaN(d.getTime()) ? "알 수 없음" : d.toISOString().split("T")[0];
            };

            rows.forEach((row) => {
                const paymentType = {
                    A: "카드",
                    B: "현금",
                    C: "기타"
                }[row.payment] || "알 수 없음";

                csvRows.push(
                    [
                        `"${row.golf_id}"`,
                        `"${row.name}"`,
                        `"${row.male === "M" ? "남자" : "여자"}"`,
                        `"${formatDate(row.b_day)}"`,
                        `"${row.p_num}"`,
                        `"${formatDate(row.s_day)}"`,
                        `"${row.r_day}"`,
                        `"${formatDate(row.f_day)}"`,
                        `"${paymentType}"`,
                        `"${row.price}"`,
                        `"${row.pro_name || "X"}"`,
                    ].join(",")
                );
            });

            const csvContent = "\uFEFF" + csvRows.join("\n");

            fs.writeFile(filePath, csvContent, (writeErr) => {
                if (writeErr) {
                    event.reply("csv-download-error", "CSV 파일을 생성하는 데 실패했습니다.");
                } else {
                    event.reply("csv-download-success", filePath);
                }
            });
        }
    );

    db.close();
});

// 라커 관리 이벤트 처리
ipcMain.on("search-golf-members", (event, query) => {
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
    const db = new sqlite3.Database(dbPath);

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
ipcMain.on("extend-locker", (event, { locker_id, additionalMonths, additionalPrice }) => {
    const db = new sqlite3.Database(dbPath);

    const query = `
        UPDATE LOCKER
        SET r_day = r_day + ?, 
            price = price + ?, 
            f_day = DATE(f_day, ? || ' months')
        WHERE l_num = ?
    `;
    db.run(
        query,
        [additionalMonths, additionalPrice, additionalMonths, locker_id],
        (err) => {
            if (err) {
                console.error("Error extending locker:", err.message);
                event.reply("extend-locker-fail");
            } else {
                console.log("Locker extended successfully.");
                event.reply("extend-locker-success");
            }
        }
    );

    db.close();
});
ipcMain.on("delete-locker", (event, lockerNumber) => {
    const db = new sqlite3.Database(dbPath);

    db.run(
        "DELETE FROM LOCKER WHERE l_num = ?",
        [lockerNumber],
        (err) => {
            if (err) {
                console.error("Error deleting locker:", err.message);
                event.reply("delete-locker-fail");
            } else {
                console.log(`Locker ${lockerNumber} deleted successfully.`);
                event.reply("delete-locker-success", lockerNumber);
            }
        }
    );

    db.close();
});

// ------------------------------------------------------------------------------