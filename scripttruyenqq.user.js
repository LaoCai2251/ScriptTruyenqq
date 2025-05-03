// ==UserScript==
// @name         Image Replacer with Menu + Movable Menu + AD remover
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Replaces images on a webpage with a draggable menu, selects and replaces specific image URLs and remove some specific ads element
// @author       Jolly Meme
// @match        https://truyenqqgo.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let selectedElement = null;
    let isSelectionMode = false;
    let isDragging = false;
    let startX, startY, menuStartX, menuStartY;

    // Tạo menu
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '10px';
    menu.style.left = '10px';
    menu.style.backgroundColor = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '10px';
    menu.style.zIndex = '9999';
    menu.style.cursor = 'move';

    // Nút bật/tắt chế độ chọn
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Bật Chọn';
    toggleButton.addEventListener('click', toggleSelectionMode);
    menu.appendChild(toggleButton);

    // Nút thay thế URL
    const replaceButton = document.createElement('button');
    replaceButton.textContent = 'Thay Thế URL';
    replaceButton.disabled = true;
    replaceButton.addEventListener('click', replaceUrl);
    menu.appendChild(replaceButton);

    // Thêm menu vào trang
    document.body.appendChild(menu);

    // Bắt đầu di chuyển menu khi nhấn chuột xuống
    menu.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        menuStartX = menu.offsetLeft;
        menuStartY = menu.offsetTop;
    });

    // Di chuyển menu khi kéo chuột
    window.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            menu.style.left = (menuStartX + dx) + 'px';
            menu.style.top = (menuStartY + dy) + 'px';
        }
    });

    // Dừng di chuyển menu khi thả chuột
    window.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Prevent accidental selection during drag
    menu.addEventListener('click', function(e){
        e.preventDefault();
    });

    // Hàm bật/tắt chế độ chọn
    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        toggleButton.textContent = isSelectionMode ? 'Tắt Chọn' : 'Bật Chọn';
        replaceButton.disabled = !isSelectionMode;
        if (isSelectionMode) {
            document.addEventListener('click', handleClick);
            console.log("Chế độ chọn đã được bật. Nhấp vào một ảnh để chọn.");
        } else {
            document.removeEventListener('click', handleClick);
            selectedElement = null;
            console.log("Chế độ chọn đã được tắt.");
        }
    }

    // Hàm xử lý sự kiện nhấp chuột
    function handleClick(event) {
        if (isSelectionMode) {
            const clickedElement = event.target;
             if (
                clickedElement.tagName === 'IMG' &&
                clickedElement.parentElement.tagName === 'A' &&
                clickedElement.parentElement.parentElement.tagName === 'TD'
            ) {
                if (selectedElement) {
                    selectedElement.style.border = '';
                }
                selectedElement = clickedElement.parentElement;
                selectedElement.style.border = '2px solid red';
                console.log("Đã chọn phần tử:", selectedElement);
                event.preventDefault();
            }
        }
    }

    // Hàm thay thế URL
    function replaceUrl() {
        if (selectedElement) {
            const newUrl = prompt("Nhập URL ảnh mới (jpg, png, gif):");
            if (newUrl) {
                if (newUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    selectedElement.setAttribute('data-mce-url', newUrl);
                    selectedElement.querySelector('img').src = newUrl;
                    console.log(`URL đã được thay thế: ${selectedElement.outerHTML}`);
                    console.log("Thay thế URL thành công!");
                } else {
                    console.log("URL không hợp lệ. Vui lòng nhập URL ảnh (jpg, png, gif).");
                }
            } else {
                console.log("Bạn đã hủy hoặc không nhập URL.");
            }
        } else {
            console.log("Không có phần tử nào được chọn.");
        }
    }

    // Remove ad elements
    function removeAdElements() {
        const adSelectors = [
            '#_pop-qqto-1',
            '#catfish-banner-info-container',
            '#catfish-banner-reading-container',
            '#ad_info_top',
            '#top-banner-reading-container',
            'div.d-flex.align-items-center.justify-content-center',
            '#ad_info',
            '#floating-banner-img',
            '#_pop-qqto-1',


        ];

        adSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
                console.log(`Removed ad element: ${selector}`);
            }
        });
    }

    // Call removeAdElements on page load and mutation
    removeAdElements();
    const observer = new MutationObserver(removeAdElements);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
