(function() {
    const scriptUrl = 'https://github.com/LaoCai2251/ScriptTruyenqq/raw/refs/heads/main/scriptruyenqq.user.js';
    const textarea = document.getElementById('code-display');
    if (!textarea) {
        console.error("Không tìm thấy thẻ textarea có ID là 'code-display'.");
        return;
    }
    console.log("Đang tải nội dung script từ:", scriptUrl);
    textarea.value = "Đang tải mã nguồn...";
    fetch(scriptUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Lỗi mạng: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(scriptContent => {
            // Điền nội dung script vào textarea
            textarea.value = scriptContent;
            console.log("Tải và điền mã nguồn thành công!");
            const copyButton = document.getElementById('copy-code-btn');
            if (copyButton) {
                copyButton.onclick = function() {
                    textarea.select();
                    textarea.setSelectionRange(0, 99999); // Dành cho mobile
                    try {
                        document.execCommand('copy');
                        alert('Đã sao chép vào clipboard!');
                    } catch (err) {
                        alert('Lỗi khi sao chép. Vui lòng thử lại.');
                    }
                    window.getSelection().removeAllRanges();
                };
            }
        })
        .catch(error => {
            console.error("Không thể tải script:", error);
            textarea.value = "Lỗi khi tải mã nguồn. Vui lòng kiểm tra lại đường dẫn và kết nối mạng.";
        });
})();
