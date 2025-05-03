// ==UserScript==
// @name         Báo lỗi truyện
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Atack
// @author       Jolly Meme
// @match        https://truyenqqto.com/*
// @grant        none
// ==/UserScript==

(function monitorErrors() {
    // Tạo menu động
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '10px';
    menu.style.left = '10px';
    menu.style.padding = '10px';
    menu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    menu.style.color = 'white';
    menu.style.fontFamily = 'Arial, sans-serif';
    menu.style.fontSize = '12px';
    menu.style.borderRadius = '5px';
    menu.style.zIndex = '9999';
    menu.style.cursor = 'move';

    // Nội dung menu
    menu.innerHTML = `
        <p><strong>Log thông báo lỗi</strong></p>
        <p>Trạng thái: <span id="status">Đang kết nối...</span></p>
        <p>Tín hiệu: <span id="signal">0ms</span></p>
        <p>
            <label for="cron-time">Thời gian gửi (ms):</label>
            <input id="cron-time" type="number" value="2000" style="width: 60px;"/>
        </p>
        <button id="toggle-cron">Tắt cron</button>
    `;
    document.body.appendChild(menu);

    // Kéo thả menu
    let isDragging = false, offsetX = 0, offsetY = 0;

    menu.addEventListener('mousedown', function (e) {
        isDragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });

    document.addEventListener('mousemove', function (e) {
        if (isDragging) {
            menu.style.top = `${e.clientY - offsetY}px`;
            menu.style.left = `${e.clientX - offsetX}px`;
        }
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });

    // Hàm gửi log lỗi
    const errorUrl = "https://truyenqqto.com/frontend/user/error";
    let cronInterval = 2000; // Thời gian mặc định
    let cronActive = true; // Trạng thái cron
    let cronId = null;

    function sendErrorLog() {
        const startTime = performance.now(); // Bắt đầu đo thời gian

        fetch(errorUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "log=Some error message from client",
        })
            .then((response) => {
                const endTime = performance.now(); // Kết thúc đo thời gian
                const latency = Math.round(endTime - startTime);

                if (!response.ok) {
                    document.getElementById("status").innerText = `Lỗi! Status code: ${response.status}`;
                    document.getElementById("signal").innerText = `${latency}ms`;
                } else {
                    document.getElementById("status").innerText = "Log gửi thành công!";
                    document.getElementById("signal").innerText = `${latency}ms`;
                }
            })
            .catch((error) => {
                document.getElementById("status").innerText = "Không thể kết nối!";
                document.getElementById("signal").innerText = "N/A";
                console.error("Không thể kết nối tới server:", error);
            });
    }

    // Hàm bật/tắt cron
    function toggleCron() {
        cronActive = !cronActive;
        const toggleButton = document.getElementById("toggle-cron");

        if (cronActive) {
            startCron();
            toggleButton.innerText = "Tắt cron";
        } else {
            stopCron();
            toggleButton.innerText = "Bật cron";
        }
    }

    // Hàm bắt đầu cron
    function startCron() {
        stopCron(); // Đảm bảo không có cron nào chạy song song
        cronId = setInterval(() => {
            sendErrorLog();
        }, cronInterval);
    }

    // Hàm dừng cron
    function stopCron() {
        if (cronId) {
            clearInterval(cronId);
            cronId = null;
        }
    }

    // Xử lý thay đổi thời gian gửi log
    document.getElementById("cron-time").addEventListener("change", function () {
        const newInterval = parseInt(this.value, 10);
        if (isNaN(newInterval) || newInterval <= 0) {
            alert("Vui lòng nhập thời gian hợp lệ (số lớn hơn 0).");
            this.value = cronInterval;
        } else {
            cronInterval = newInterval;
            if (cronActive) {
                startCron(); // Restart cron với thời gian mới
            }
        }
    });

    // Thêm sự kiện vào nút bật/tắt cron
    document.getElementById("toggle-cron").addEventListener("click", toggleCron);

    // Bắt đầu cron mặc định
    startCron();
})();
