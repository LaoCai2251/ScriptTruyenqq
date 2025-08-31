// ==UserScript==
// @name         TruyenQQ Emoji Custom
// @namespace    http://tampermonkey.net/
// @version      8.1
// @description  Custom emoji
// @author       Jolly Meme x LaoCai2255
// @match        https://truyenqqgo.com/*
// @match        file:///*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      tenor.googleapis.com
// @connect      c.tenor.com
// @run-at       document-start
// @downloadURL  https://github.com/LaoCai2251/ScriptTruyenqq/raw/refs/heads/main/scriptruyenqq.user.js
// @updateURL    https://github.com/LaoCai2251/ScriptTruyenqq/raw/refs/heads/main/scriptruyenqq.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- POP-UP BLOCKER ---
    const originalWindowOpen = window.open;
    window.open = function(url, name, features) {
         if (url && typeof url === 'string' && (url.includes('tiktok.com') || url.includes('mplmncb.com') || url.includes('sin88.sx'))) {
        console.log('%c[Blocker] Blocked a pop-up attempt to: ' + url, 'color: #ff6347;');
        return null;
        return originalWindowOpen.apply(window, arguments);
    };

    window.addEventListener('DOMContentLoaded', async () => {
        let currentPageKey = null; // Tenor uses a 'next' key instead of page numbers
        let currentTags = '';

        // --- CÀI ĐẶT STYLE SAKURA ---
        const sakuraStyle = `
            #tenor-search-panel * { box-sizing: border-box; }
            #tenor-search-panel {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #555; background: linear-gradient(135deg, #fff0f5, #ffffff);
                border: 1px solid #ffb6c1; border-radius: 8px; box-shadow: 0 4px 15px rgba(255, 182, 193, 0.4);
                width: 380px; max-height: 550px;
            }
            #tenor-search-header { background-color: #ffb6c1; color: white; border-radius: 8px 8px 0 0; padding: 8px 12px; cursor: move; }
            #tenor-search-panel button {
                background-color: #ffb6c1; color: white; border: none; padding: 8px 12px; border-radius: 5px;
                cursor: pointer; transition: background-color 0.2s, box-shadow 0.2s; font-weight: bold;
            }
            #tenor-search-panel button:hover:not(:disabled) { background-color: #ff98a9; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
            #tenor-search-panel button:disabled { background-color: #e0e0e0; cursor: not-allowed; }
            #tenor-search-panel input[type="text"] {
                border: 1px solid #ddd; border-radius: 5px; padding: 8px; width: 100%; transition: border-color 0.2s, box-shadow 0.2s;
            }
            #tenor-search-panel input[type="text"]:focus { border-color: #ffb6c1; box-shadow: 0 0 5px rgba(255, 182, 193, 0.5); outline: none; }
            #tenor-results-container { scrollbar-color: #ffb6c1 #fdeef1; scrollbar-width: thin; }
            #tenor-results-container::-webkit-scrollbar { width: 8px; }
            #tenor-results-container::-webkit-scrollbar-track { background: #fdeef1; }
            #tenor-results-container::-webkit-scrollbar-thumb { background-color: #ffb6c1; border-radius: 4px; }
            #tenor-results-container img { transition: transform 0.2s ease-in-out, box-shadow 0.2s; }
            #tenor-results-container img:hover { transform: scale(1.1); box-shadow: 0 0 10px rgba(255, 182, 193, 0.8); z-index: 10; }
            .tenor-loader {
                width: 40px; height: 40px; border: 5px solid #fdeef1; border-bottom-color: #ffb6c1;
                border-radius: 50%; display: inline-block; box-sizing: border-box; animation: rotation 1s linear infinite;
            }
            @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = sakuraStyle;
        document.head.appendChild(styleSheet);

        // --- Giao diện (HTML Structure) ---
        const panel = document.createElement('div');
        panel.id = 'tenor-search-panel';
        Object.assign(panel.style, { position: 'fixed', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: '100000', padding: '10px' });

        panel.innerHTML = `
            <div id="tenor-search-header">🌸 Emoji Search 🌸</div>
            <input type="text" id="tenor-search-input" placeholder="Nhập từ khóa tìm GIF...">
            <div style="display: flex; gap: 5px; justify-content: space-between;">
                <button id="tenor-search-btn">Tìm kiếm</button>
                <button id="tenor-add-url-btn">Thêm từ URL</button>
            </div>
            <div id="tenor-results-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 5px; overflow-y: auto; flex-grow: 1; border: 1px solid #eee; padding: 5px; min-height: 250px; background: #fef8fa;">
                <p style="grid-column: 1 / -1; text-align: center; color: #aaa; margin-top: 20px;">Tìm kiếm GIF để bình luận nào! 💖</p>
            </div>
            <div id="tenor-pagination" style="display: flex; justify-content: center; align-items: center; margin-top: 5px;">
                <button id="tenor-next-btn" style="width: 100%;" disabled>Xem thêm kết quả</button>
            </div>
        `;
        document.body.appendChild(panel);

        const searchInput = panel.querySelector('#tenor-search-input');
        const searchBtn = panel.querySelector('#tenor-search-btn');
        const addUrlBtn = panel.querySelector('#tenor-add-url-btn');
        const resultsContainer = panel.querySelector('#tenor-results-container');
        const nextBtn = panel.querySelector('#tenor-next-btn');

        currentTags = await GM_getValue('last_tenor_search', '');
        searchInput.value = currentTags;

        makeDraggable(panel, panel.querySelector('#tenor-search-header'));
        searchBtn.onclick = () => { currentPageKey = null; resultsContainer.innerHTML = ''; performSearch(); };
        addUrlBtn.onclick = addEmojiByUrl;
        nextBtn.onclick = () => performSearch();
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { currentPageKey = null; resultsContainer.innerHTML = ''; performSearch(); } });

        async function performSearch() {
            currentTags = searchInput.value.trim();
            if (!currentTags) { resultsContainer.innerHTML = '<p style="text-align:center; color: #888;">Vui lòng nhập từ khóa.</p>'; return; }
            await GM_setValue('last_tenor_search', currentTags);

            if (!currentPageKey) { // Only show loader on first search
                resultsContainer.innerHTML = '<div style="grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; height: 100px;"><div class="tenor-loader"></div></div>';
            }
            searchBtn.disabled = true;
            nextBtn.disabled = true;

            const tenorAPIKey = "AIzaSyC-P6_qz3FzCoXGLk6tgitZo4jEJ5mLzD8"; // Extracted from tenor.js
            const clientKey = "tenor_web";
            let searchUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(currentTags)}&key=${tenorAPIKey}&client_key=${clientKey}&limit=20`;
            if (currentPageKey) {
                searchUrl += `&pos=${currentPageKey}`;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: searchUrl,
                responseType: 'json',
                onload: res => {
                    if (res.status >= 200 && res.status < 300) {
                        parseAndDisplayResults(res.response);
                    } else {
                        resultsContainer.innerHTML = `<p style="color:red; text-align:center; grid-column:1/-1;">Lỗi: ${res.statusText}</p>`;
                    }
                },
                onerror: () => resultsContainer.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Lỗi kết nối.</p>',
                onfinally: () => { searchBtn.disabled = false; }
            });
        }

        function parseAndDisplayResults(jsonData) {
            const results = jsonData.results || [];

            if (!currentPageKey) resultsContainer.innerHTML = ''; // Clear for new search

            if (results.length === 0 && !currentPageKey) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #aaa; margin-top: 20px;">Không tìm thấy kết quả nào.</p>';
            }

            results.forEach(item => {
                const gifPreview = item.media_formats.gifpreview;
                const gifFull = item.media_formats.gif;
                if (gifPreview && gifFull) {
                    const thumbImg = document.createElement('img');
                    Object.assign(thumbImg.style, { width: '100%', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '3px' });
                    thumbImg.src = gifPreview.url;
                    thumbImg.title = item.content_description || 'Click to insert GIF';
                    thumbImg.onclick = () => insertEmoji(gifFull.url);
                    resultsContainer.appendChild(thumbImg);
                }
            });

            currentPageKey = jsonData.next || null;
            nextBtn.disabled = !currentPageKey;
        }

        function insertEmoji(url) {
            if (typeof tinymce !== 'undefined' && tinymce.activeEditor) {
                tinymce.activeEditor.execCommand('mceInsertContent', false, `<img src="${url}" alt="emoji" style="max-height: 120px;"/>`);
            } else { alert("Chưa chọn khung bình luận để chèn emoji."); }
        }

        async function addEmojiByUrl() {
            const emojiUrl = prompt("Dán URL ảnh/gif:");
            if (emojiUrl) insertEmoji(emojiUrl);
        }

        function makeDraggable(element, handle) {
            let isDragging = false, startX, startY, elStartX, elStartY;
            handle.addEventListener('mousedown', e => { isDragging = true; e.preventDefault(); startX = e.clientX; startY = e.clientY; elStartX = element.offsetLeft; elStartY = element.offsetTop; });
            window.addEventListener('mousemove', e => { if (isDragging) { element.style.left = (elStartX + e.clientX - startX) + 'px'; element.style.top = (elStartY + e.clientY - startY) + 'px'; } });
            window.addEventListener('mouseup', () => { isDragging = false; });
        }

        function removeAdElements() {
            const adSelectors = ['#_pop-qqto-1','.alert-note','[id*="banner"]','[class*="banner"]','.d-flex.align-items-center.justify-content-center','#ad_info','#ad_info_2','[id*="floating"]','[data-cl-spot]','iframe[src*="facebook.com"]'];
            adSelectors.forEach(s => document.querySelectorAll(s).forEach(e => e.remove()));
            document.querySelectorAll('span.text-center').forEach(span => { if (span.textContent.trim() === 'Quảng cáo') span.remove(); });
        }
        removeAdElements();
        new MutationObserver(removeAdElements).observe(document.body, { childList: true, subtree: true });
    });
})();
