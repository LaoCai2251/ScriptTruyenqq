// ==UserScript==
// @name         TruyenQQ Emoji Helper (Danbooru Sakura Edition)
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Adds a beautiful, sakura-themed Danbooru emoji search panel to truyenqqgo.com's comment section.
// @author       Jolly Meme
// @match        https://truyenqqgo.com/*
// @match        file:///*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      danbooru.donmai.us
// @run-at       document-start
// @downloadURL  https://github.com/LaoCai2251/ScriptTruyenqq/raw/refs/heads/main/scriptruyenqq.user.js
// ==/UserScript==

(function() {
    'use-strict';

    // --- POP-UP BLOCKER ---
    const originalWindowOpen = window.open;
    window.open = function(url, name, features) {
        if (url && typeof url === 'string' && (url.includes('tiktok.com') || url.includes('mplmncb.com'))) return null;
        return originalWindowOpen.apply(window, arguments);
    };

    window.addEventListener('DOMContentLoaded', async () => {
        let currentPage = 1;
        let currentTags = '';

        // --- CÀI ĐẶT STYLE SAKURA ---
        const sakuraStyle = `
            #danbooru-search-panel * { box-sizing: border-box; }
            #danbooru-search-panel {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #555; background: linear-gradient(135deg, #fff0f5, #ffffff);
                border: 1px solid #ffb6c1; border-radius: 8px; box-shadow: 0 4px 15px rgba(255, 182, 193, 0.4);
                width: 380px; max-height: 550px;
            }
            #danbooru-search-header { background-color: #ffb6c1; color: white; border-radius: 8px 8px 0 0; padding: 8px 12px; }
            #danbooru-search-panel button {
                background-color: #ffb6c1; color: white; border: none; padding: 8px 12px; border-radius: 5px;
                cursor: pointer; transition: background-color 0.2s, box-shadow 0.2s; font-weight: bold;
            }
            #danbooru-search-panel button:hover:not(:disabled) { background-color: #ff98a9; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
            #danbooru-search-panel button:disabled { background-color: #e0e0e0; cursor: not-allowed; }
            #danbooru-search-panel input[type="text"] {
                border: 1px solid #ddd; border-radius: 5px; padding: 8px; width: 100%; transition: border-color 0.2s, box-shadow 0.2s;
            }
            #danbooru-search-panel input[type="text"]:focus { border-color: #ffb6c1; box-shadow: 0 0 5px rgba(255, 182, 193, 0.5); outline: none; }
            #danbooru-results-container { scrollbar-color: #ffb6c1 #fdeef1; scrollbar-width: thin; }
            #danbooru-results-container::-webkit-scrollbar { width: 8px; }
            #danbooru-results-container::-webkit-scrollbar-track { background: #fdeef1; }
            #danbooru-results-container::-webkit-scrollbar-thumb { background-color: #ffb6c1; border-radius: 4px; }
            #danbooru-results-container img { transition: transform 0.2s ease-in-out, box-shadow 0.2s; }
            #danbooru-results-container img:hover { transform: scale(1.1); box-shadow: 0 0 10px rgba(255, 182, 193, 0.8); z-index: 10; }
            .danbooru-loader {
                width: 40px; height: 40px; border: 5px solid #fdeef1; border-bottom-color: #ffb6c1;
                border-radius: 50%; display: inline-block; box-sizing: border-box; animation: rotation 1s linear infinite;
            }
            @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            #page-input { width: 50px; text-align: center; }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = sakuraStyle;
        document.head.appendChild(styleSheet);

        // --- Giao diện (HTML Structure) ---
        const panel = document.createElement('div');
        panel.id = 'danbooru-search-panel';
        Object.assign(panel.style, { position: 'fixed', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: '100000', padding: '10px' });

        panel.innerHTML = `
            <div id="danbooru-search-header">🌸 Danbooru Emoji Search 🌸</div>
            <input type="text" id="danbooru-search-input" placeholder="Nhập tags (vd: cute gif)">
            <div style="display: flex; gap: 5px; justify-content: space-between;">
                <button id="danbooru-search-btn">Tìm kiếm</button>
                <button id="danbooru-add-url-btn">Thêm từ URL</button>
            </div>
            <div id="danbooru-results-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 5px; overflow-y: auto; flex-grow: 1; border: 1px solid #eee; padding: 5px; min-height: 200px; background: #fef8fa;">
                <p style="grid-column: 1 / -1; text-align: center; color: #aaa; margin-top: 20px;">Tìm kiếm emoji hoa anh đào nào! 🌸</p>
            </div>
            <div id="danbooru-pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <button id="danbooru-prev-btn" disabled>« Trước</button>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span>Trang</span>
                    <input type="text" id="page-input" value="1">
                </div>
                <button id="danbooru-next-btn" disabled>Sau »</button>
            </div>
        `;
        document.body.appendChild(panel);

        const searchInput = panel.querySelector('#danbooru-search-input');
        const searchBtn = panel.querySelector('#danbooru-search-btn');
        const addUrlBtn = panel.querySelector('#danbooru-add-url-btn');
        const resultsContainer = panel.querySelector('#danbooru-results-container');
        const prevBtn = panel.querySelector('#danbooru-prev-btn');
        const nextBtn = panel.querySelector('#danbooru-next-btn');
        const pageInput = panel.querySelector('#page-input');

        // Load last search query
        currentTags = await GM_getValue('last_danbooru_search', '');
        searchInput.value = currentTags.replace(/\+/g, ' ');

        makeDraggable(panel, panel.querySelector('#danbooru-search-header'));
        searchBtn.onclick = () => { currentPage = 1; performSearch(); };
        addUrlBtn.onclick = addEmojiByUrl;
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; performSearch(); } };
        nextBtn.onclick = () => { currentPage++; performSearch(); };
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { currentPage = 1; performSearch(); } });
        pageInput.addEventListener('keydown', e => { if (e.key === 'Enter') { currentPage = parseInt(pageInput.value) || 1; performSearch(); } });

        async function performSearch() {
            currentTags = searchInput.value.trim().replace(/\s+/g, '+');
            await GM_setValue('last_danbooru_search', currentTags);

            if (!currentTags) { resultsContainer.innerHTML = '<p style="text-align:center; color: #888;">Vui lòng nhập từ khóa.</p>'; return; }

            resultsContainer.innerHTML = '<div style="grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; height: 100px;"><div class="danbooru-loader"></div></div>';
            pageInput.value = currentPage;

            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://danbooru.donmai.us/posts?page=${currentPage}&tags=${encodeURIComponent(currentTags)}`,
                onload: res => (res.status >= 200 && res.status < 300) ? parseAndDisplayResults(res.responseText) : resultsContainer.innerHTML = `<p style="color:red; text-align:center; grid-column:1/-1;">Lỗi: ${res.statusText}</p>`,
                onerror: () => resultsContainer.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Lỗi kết nối.</p>'
            });
        }

        function parseAndDisplayResults(htmlText) {
            resultsContainer.innerHTML = '';
            const posts = new DOMParser().parseFromString(htmlText, 'text/html').querySelectorAll('.posts-container > article.post-preview');

            if (posts.length === 0) resultsContainer.innerHTML = '<p style="text-align:center; color: #aaa; margin-top: 20px;">Không tìm thấy kết quả.</p>';

            posts.forEach(post => {
                const img = post.querySelector('img.post-preview-image');
                const link = post.querySelector('a.post-preview-link');
                if (img && link) {
                    const thumbImg = document.createElement('img');
                    Object.assign(thumbImg.style, { width: '100%', height: '60px', objectFit: 'cover', cursor: 'pointer', borderRadius: '3px' });
                    thumbImg.src = img.src;
                    thumbImg.title = `Post #${post.dataset.id} - Click để lấy ảnh gốc`;
                    thumbImg.onclick = () => fetchAndInsertOriginalImage(`https://danbooru.donmai.us${link.getAttribute('href')}`);
                    resultsContainer.appendChild(thumbImg);
                }
            });
            updatePagination(posts.length > 0);
            resultsContainer.scrollTop = 0; // Scroll to top on new results
        }

        function fetchAndInsertOriginalImage(postUrl) {
            resultsContainer.style.opacity = '0.5'; searchBtn.disabled = true;
            GM_xmlhttpRequest({
                method: 'GET', url: postUrl,
                onload: res => {
                    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
                    const ugoira = doc.querySelector(".ugoira-container[data-file-url]");
                    const image = doc.querySelector('img#image');
                    const imageUrl = ugoira?.dataset.fileUrl || image?.src;
                    imageUrl ? insertEmoji(imageUrl) : alert('Không tìm thấy URL ảnh gốc.');
                },
                onerror: () => alert('Lỗi khi tải trang chi tiết ảnh.'),
                onfinally: () => { resultsContainer.style.opacity = '1'; searchBtn.disabled = false; }
            });
        }

        function updatePagination(hasNextPage) {
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = !hasNextPage;
        }

        function insertEmoji(url) {
            if (typeof tinymce !== 'undefined' && tinymce.activeEditor) {
                tinymce.activeEditor.execCommand('mceInsertContent', false, `<img src="${url}" alt="emoji" style="max-height: 100px;"/>`);
            } else { alert("Chưa chọn khung bình luận để chèn emoji."); }
        }

        async function addEmojiByUrl() {
            const emojiUrl = prompt("Dán URL ảnh của emoji (jpg, png, gif):");
            if (emojiUrl && emojiUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) insertEmoji(emojiUrl);
            else if (emojiUrl) alert("URL không hợp lệ.");
        }

        function makeDraggable(element, handle) {
            let isDragging = false, startX, startY, elStartX, elStartY;
            handle.addEventListener('mousedown', e => {
                isDragging = true; e.preventDefault(); startX = e.clientX; startY = e.clientY;
                elStartX = element.offsetLeft; elStartY = element.offsetTop;
            });
            window.addEventListener('mousemove', e => { if (isDragging) { element.style.left = (elStartX + e.clientX - startX) + 'px'; element.style.top = (elStartY + e.clientY - startY) + 'px'; } });
            window.addEventListener('mouseup', () => { isDragging = false; });
        }

        // AD BLOCKER
        function removeAdElements() {
            const adSelectors = ['#_pop-qqto-1','.alert-note','[id*="banner"]','[class*="banner"]','.d-flex.align-items-center.justify-content-center','#ad_info','#ad_info_2','[id*="floating"]','[data-cl-spot]','iframe[src*="facebook.com"]'];
            adSelectors.forEach(s => document.querySelectorAll(s).forEach(e => e.remove()));
            document.querySelectorAll('span.text-center').forEach(span => { if (span.textContent.trim() === 'Quảng cáo') span.remove(); });
        }
        removeAdElements();
        new MutationObserver(removeAdElements).observe(document.body, { childList: true, subtree: true });
    });
})();
