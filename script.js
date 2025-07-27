// ===================================================================
// 결정장애 돌림판 - 최종 완벽 버전
// 설계: 수학적으로 완벽한 계산식 + 완전 분리된 로직 + 리셋 기능
// ===================================================================

// [1. 기본 변수 및 상태 설정]
// DOM 요소들 가져오기
const canvas = document.getElementById('roulette-canvas');
const ctx = canvas.getContext('2d');
const itemInput = document.getElementById('item-input');
const addButton = document.getElementById('add-button');
const spinButton = document.getElementById('spin-button');
const resetButton = document.getElementById('reset-button');
const itemsList = document.getElementById('items-list');
const resultElement = document.getElementById('result');
const arrowPointer = document.querySelector('.arrow-pointer');

// 즐겨찾기 관련 DOM 요소들
const favoriteNameInput = document.getElementById('favorite-name-input');
const saveFavoriteButton = document.getElementById('save-favorite-button');
const favoritesList = document.getElementById('favorites-list');
const clearAllFavoritesButton = document.getElementById('clear-all-favorites-button');

// 상태 변수들
let items = []; // 항목 배열
let currentRotation = 0; // 현재 돌림판의 총 회전 각도 (라디안)
let isSpinning = false; // 회전 중복 방지 플래그
let animationId = null; // 애니메이션 ID
let preSelectedWinner = null; // 미리 결정된 승자

// 반응형 캔버스 크기 계산 (모바일 + 데스크톱)
const initializeCanvas = () => {
    const containerWidth = canvas.parentElement.clientWidth;
    const isDesktop = window.innerWidth >= 768;
    
    // 데스크톱: 320px, 모바일: 컨테이너에 맞춤 (최대 280px)
    const maxSize = isDesktop 
        ? 320 
        : Math.min(containerWidth - 40, 280);
    
    canvas.width = maxSize;
    canvas.height = maxSize;
    canvas.style.width = maxSize + 'px';
    canvas.style.height = maxSize + 'px';
    
    return {
        centerX: maxSize / 2,
        centerY: maxSize / 2,
        radius: maxSize / 2 - 20
    };
};

// 캔버스 크기 정보 (동적으로 계산)
let canvasInfo = initializeCanvas();

// ===================================================================
// [2. drawRoulette() 함수: 오직 그리기만 담당]
// 역할: currentRotation 값을 기반으로 현재 상태의 돌림판을 그리기
// ===================================================================
const drawRoulette = () => {
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (items.length === 0) {
        // 빈 상태 표시
        drawEmptyWheel();
        return;
    }
    
    // 좌표계 변환: ctx.save(), ctx.translate(), ctx.rotate(), ctx.restore() 패턴
    ctx.save();
    
    // 캔버스 중심으로 좌표 이동
    ctx.translate(canvasInfo.centerX, canvasInfo.centerY);
    
    // currentRotation만큼 캔버스 자체를 회전
    ctx.rotate(currentRotation);
    
    // 조각 그리기: items 배열을 순회하며 각 조각의 색상과 텍스트를 정확한 위치에 그리기
    const sliceAngle = (2 * Math.PI) / items.length;
    
    items.forEach((item, index) => {
        // 각 조각의 시작과 끝 각도 계산 (12시 방향부터 시작)
        const startAngle = index * sliceAngle - Math.PI / 2;
        const endAngle = (index + 1) * sliceAngle - Math.PI / 2;
        
        // 조각 색상 생성
        const hue = (index * 360 / items.length) % 360;
        const sliceColor = `hsl(${hue}, 70%, 60%)`;
        
        // 조각 그리기
        drawSlice(startAngle, endAngle, sliceColor);
        
        // 텍스트를 조각의 중앙에 올바른 방향으로 그리기
        const textAngle = startAngle + sliceAngle / 2;
        drawSliceText(item, textAngle);
    });
    
    // 중앙 원 그리기
    drawCenterCircle();
    
    // 좌표계 복원
    ctx.restore();
};

// 빈 돌림판 그리기
const drawEmptyWheel = () => {
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.arc(canvasInfo.centerX, canvasInfo.centerY, canvasInfo.radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = `${Math.max(14, canvasInfo.radius / 10)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('항목을 추가해주세요', canvasInfo.centerX, canvasInfo.centerY);
};

// 개별 조각 그리기
const drawSlice = (startAngle, endAngle, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, canvasInfo.radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    
    // 테두리 그리기
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, canvasInfo.radius / 60);
    ctx.stroke();
};

// 조각 텍스트 그리기 (정확한 위치와 방향)
const drawSliceText = (text, textAngle) => {
    const textRadius = canvasInfo.radius * 0.75;
    const textX = Math.cos(textAngle) * textRadius;
    const textY = Math.sin(textAngle) * textRadius;
    
    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    
    // 동적 폰트 크기 계산
    const fontSize = Math.max(10, Math.min(16, canvasInfo.radius / 10));
    
    // 텍스트 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 1, 1);
    
    // 실제 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
    
    ctx.restore();
};

// 중앙 원 그리기
const drawCenterCircle = () => {
    const centerRadius = Math.max(8, canvasInfo.radius / 15);
    
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, centerRadius / 8);
    ctx.stroke();
};

// ===================================================================
// [3. spin() 함수: 가장 정확한 목표 계산 및 실행]
// ===================================================================
const spin = () => {
    // 중복 실행 방지
    if (isSpinning || items.length === 0) return;
    
    isSpinning = true;
    updateSpinButtonState();
    updateArrowState('spinning');
    
    // 🔄 중요: 새로운 스핀 시작 전 회전 각도를 0으로 리셋 (누적 오류 방지)
    currentRotation = 0;
    drawRoulette(); // 리셋된 상태로 돌림판 다시 그리기
    
    console.log(`🔄 회전 각도 리셋: currentRotation = 0`);
    
    // 1단계: 승자 결정 (애니메이션 시작 전)
    const winnerIndex = Math.floor(Math.random() * items.length);
    const winnerItem = items[winnerIndex];
    preSelectedWinner = { index: winnerIndex, item: winnerItem };
    
    console.log(`🎯 === 승자 결정 ===`);
    console.log(`🏆 승자: items[${winnerIndex}] = "${winnerItem}"`);
    
    // 2단계: 최종 목표 각도 계산 (항상 0도 기준으로 계산)
    const sliceAngle = (2 * Math.PI) / items.length;
    
    // 🧮 핵심 공식: 승자 조각의 중앙이 12시 방향에 오기 위한 최종 회전 각도
    // "10바퀴를 돌고, 승자 조각의 시작점까지 되감고, 다시 조각의 절반만큼 더 되감는"
    // 항상 0도를 기준으로 계산하므로 currentRotation을 더하지 않음
    let winnerTargetRotation = (2 * Math.PI * 10) - (winnerIndex * sliceAngle) - (sliceAngle / 2);
    
    // 자연스러움을 위한 약간의 랜덤 값 추가 (조각 중앙에 정확히 멈추지 않도록)
    const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.3); // ±15% 랜덤
    winnerTargetRotation += randomOffset;
    
    // 최종 목표 회전 (0도에서 시작하므로 currentRotation 더하지 않음)
    const finalTargetRotation = winnerTargetRotation;
    
    console.log(`📐 조각 크기: ${(sliceAngle * 180 / Math.PI).toFixed(1)}도`);
    console.log(`🎯 목표 회전: ${(winnerTargetRotation * 180 / Math.PI).toFixed(1)}도`);
    console.log(`🚀 최종 목표: ${(finalTargetRotation * 180 / Math.PI).toFixed(1)}도`);
    
    // 3단계: 애니메이션 및 결과 표시
    startSpinAnimation(finalTargetRotation);
};

// 스핀 애니메이션 시작
const startSpinAnimation = (targetRotation) => {
    const startRotation = currentRotation;
    const totalRotation = targetRotation - startRotation;
    const duration = 5000; // 5초
    const startTime = performance.now();
    
    console.log(`🎬 애니메이션 시작 (${duration/1000}초, ${(totalRotation * 180 / Math.PI).toFixed(1)}도 회전)`);
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 부드럽게 감속하는 easing 함수
        const easedProgress = easeOutCubic(progress);
        
        // currentRotation 값을 업데이트
        currentRotation = startRotation + (totalRotation * easedProgress);
        
        // 매 프레임마다 drawRoulette() 호출
        drawRoulette();
        
        if (progress < 1) {
            animationId = requestAnimationFrame(animate);
        } else {
            // 애니메이션 완료
            finishSpin();
        }
    };
    
    animationId = requestAnimationFrame(animate);
};

// Easing 함수 (점진적 감속)
const easeOutCubic = (t) => {
    return 1 - Math.pow(1 - t, 3);
};

// 스핀 완료 처리
const finishSpin = () => {
    isSpinning = false;
    animationId = null;
    
    console.log(`🛑 애니메이션 완료`);
    console.log(`📐 최종 각도: ${(currentRotation * 180 / Math.PI).toFixed(1)}도`);
    console.log(`🎉 결과: "${preSelectedWinner.item}"`);
    
    // 결과 표시 (1단계에서 결정한 승자 사용, 다시 계산 금지)
    showResult(preSelectedWinner.item);
    
    // UI 상태 복원
    updateSpinButtonState();
    updateArrowState('result');
    
    // 화살표 강조 효과 제거
    setTimeout(() => {
        updateArrowState('normal');
    }, 2000);
};

// ===================================================================
// [4. reset() 함수: 리셋 기능]
// ===================================================================
const reset = () => {
    // 애니메이션 중이면 중단
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // 상태 초기화
    items = []; // items 배열 비우기
    currentRotation = 0; // currentRotation = 0으로 초기화
    isSpinning = false;
    preSelectedWinner = null;
    
    // UI 업데이트
    updateItemsList();
    drawRoulette(); // 깨끗한 돌림판을 다시 그리기
    updateSpinButtonState();
    updateSaveFavoriteButton(); // 저장 버튼 상태 업데이트
    updateArrowState('normal');
    
    // 결과 텍스트 비우기
    resultElement.textContent = '항목을 추가하고 돌림판을 돌려보세요!';
    resultElement.className = 'text-center text-lg text-gray-600 min-h-[3rem] flex items-center justify-center';
    
    // 즐겨찾기 입력창 초기화
    favoriteNameInput.value = '';
    
    // 입력창 포커스
    itemInput.focus();
    
    console.log(`🔄 === 리셋 완료 ===`);
    console.log(`✅ 모든 상태가 초기화되었습니다.`);
};

// ===================================================================
// [5. 즐겨찾기 기능]
// ===================================================================

// localStorage에서 즐겨찾기 목록 가져오기
const getFavorites = () => {
    try {
        const favorites = localStorage.getItem('roulette-favorites');
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('즐겨찾기 불러오기 오류:', error);
        return [];
    }
};

// localStorage에 즐겨찾기 목록 저장
const setFavorites = (favorites) => {
    try {
        localStorage.setItem('roulette-favorites', JSON.stringify(favorites));
        console.log('즐겨찾기 저장 완료');
    } catch (error) {
        console.error('즐겨찾기 저장 오류:', error);
        alert('저장 공간이 부족합니다. 일부 즐겨찾기를 삭제해주세요.');
    }
};

// 현재 돌림판을 즐겨찾기로 저장
const saveFavorite = () => {
    const name = favoriteNameInput.value.trim();
    
    if (!name) {
        alert('돌림판 이름을 입력해주세요!');
        favoriteNameInput.focus();
        return;
    }
    
    if (items.length === 0) {
        alert('저장할 항목이 없습니다!');
        return;
    }
    
    const favorites = getFavorites();
    
    // 동일한 이름이 있는지 확인
    const existingIndex = favorites.findIndex(fav => fav.name === name);
    
    if (existingIndex !== -1) {
        const overwrite = confirm(`"${name}" 돌림판이 이미 있습니다. 덮어쓰시겠습니까?`);
        if (!overwrite) {
            favoriteNameInput.focus();
            return;
        }
        // 기존 항목 업데이트
        favorites[existingIndex] = {
            name: name,
            items: [...items],
            createdAt: Date.now()
        };
    } else {
        // 새 항목 추가
        favorites.push({
            name: name,
            items: [...items],
            createdAt: Date.now()
        });
    }
    
    setFavorites(favorites);
    favoriteNameInput.value = '';
    updateFavoritesList();
    updateSaveFavoriteButton();
    
    console.log(`💾 즐겨찾기 저장: "${name}" (${items.length}개 항목)`);
    
    // 성공 메시지
    const successMsg = document.createElement('div');
    successMsg.className = 'text-xs text-green-600 mt-1';
    successMsg.textContent = `✅ "${name}" 저장 완료!`;
    favoriteNameInput.parentNode.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.remove();
    }, 2000);
};

// 저장된 돌림판 불러오기
const loadFavorite = (index) => {
    const favorites = getFavorites();
    
    if (index < 0 || index >= favorites.length) {
        alert('존재하지 않는 즐겨찾기입니다.');
        return;
    }
    
    const favorite = favorites[index];
    
    // 현재 항목이 있으면 확인
    if (items.length > 0) {
        const confirm = window.confirm(`현재 항목들이 "${favorite.name}" 돌림판으로 바뀝니다. 계속하시겠습니까?`);
        if (!confirm) return;
    }
    
    // 항목 불러오기
    items = [...favorite.items];
    
    // 돌림판 상태 초기화
    currentRotation = 0;
    
    // UI 업데이트
    updateItemsList();
    drawRoulette();
    updateSpinButtonState();
    
    // 결과 영역 초기화
    resultElement.textContent = '항목을 추가하고 돌림판을 돌려보세요!';
    resultElement.className = 'text-center text-lg text-gray-600 min-h-[3rem] flex items-center justify-center';
    
    console.log(`📂 즐겨찾기 불러오기: "${favorite.name}" (${favorite.items.length}개 항목)`);
    
    // 성공 메시지
    const successMsg = document.createElement('div');
    successMsg.className = 'text-xs text-blue-600 mt-1 text-center';
    successMsg.textContent = `📂 "${favorite.name}" 불러오기 완료!`;
    favoritesList.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.remove();
    }, 2000);
};

// 특정 즐겨찾기 삭제
const deleteFavorite = (index) => {
    const favorites = getFavorites();
    
    if (index < 0 || index >= favorites.length) {
        alert('존재하지 않는 즐겨찾기입니다.');
        return;
    }
    
    const favorite = favorites[index];
    const confirmDelete = confirm(`"${favorite.name}" 돌림판을 삭제하시겠습니까?`);
    
    if (!confirmDelete) return;
    
    favorites.splice(index, 1);
    setFavorites(favorites);
    updateFavoritesList();
    
    console.log(`🗑️ 즐겨찾기 삭제: "${favorite.name}"`);
};

// 모든 즐겨찾기 삭제
const clearAllFavorites = () => {
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        alert('삭제할 즐겨찾기가 없습니다.');
        return;
    }
    
    const confirmDelete = confirm(`모든 즐겨찾기 돌림판(${favorites.length}개)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
    
    if (!confirmDelete) return;
    
    setFavorites([]);
    updateFavoritesList();
    
    console.log(`🗑️ 모든 즐겨찾기 삭제 (${favorites.length}개)`);
    
    alert('모든 즐겨찾기가 삭제되었습니다.');
};

// 즐겨찾기 목록 UI 업데이트
const updateFavoritesList = () => {
    const favorites = getFavorites();
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">저장된 돌림판이 없습니다.</div>';
        clearAllFavoritesButton.style.display = 'none';
        return;
    }
    
    clearAllFavoritesButton.style.display = 'inline';
    
    favorites.forEach((favorite, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl shadow-sm';
        
        favoriteItem.innerHTML = `
            <div class="flex-1 min-w-0">
                <div class="text-base font-semibold text-gray-800 truncate">${favorite.name}</div>
                <div class="text-sm text-gray-500">${favorite.items.length}개 항목 • ${new Date(favorite.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="flex gap-2 ml-2">
                <button 
                    class="load-favorite-btn px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
                    data-index="${index}"
                >
                    📂
                </button>
                <button 
                    class="delete-favorite-btn px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors"
                    data-index="${index}"
                >
                    🗑️
                </button>
            </div>
        `;
        
        favoritesList.appendChild(favoriteItem);
    });
    
    // 이벤트 리스너 추가
    document.querySelectorAll('.load-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            loadFavorite(index);
        });
    });
    
    document.querySelectorAll('.delete-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteFavorite(index);
        });
    });
};

// 저장 버튼 상태 업데이트
const updateSaveFavoriteButton = () => {
    const hasItems = items.length > 0;
    const hasName = favoriteNameInput.value.trim().length > 0;
    
    saveFavoriteButton.disabled = !hasItems || !hasName;
};

// ===================================================================
// [6. 기타 유틸리티 함수들]
// ===================================================================

// 항목 추가
const addItem = () => {
    const value = itemInput.value.trim();
    
    if (!value) {
        alert('항목을 입력해주세요!');
        itemInput.focus();
        return;
    }
    
    if (items.includes(value)) {
        alert('이미 추가된 항목입니다!');
        itemInput.focus();
        return;
    }
    
    items.push(value);
    itemInput.value = '';
    itemInput.focus();
    
    // 🔄 항목 추가 후 돌림판 각도를 0으로 리셋 (구성 변경으로 인한 오류 방지)
    currentRotation = 0;
    
    updateItemsList();
    drawRoulette(); // 초기 상태로 돌림판 다시 그리기
    updateSpinButtonState();
    updateSaveFavoriteButton(); // 저장 버튼 상태 업데이트
    
    console.log(`➕ 항목 추가: "${value}" (총 ${items.length}개)`);
    console.log(`🔄 돌림판 각도 리셋: currentRotation = 0`);
};

// 항목 삭제
const removeItem = (index) => {
    const removedItem = items[index];
    items.splice(index, 1);
    
    // 🔄 항목 제거 후 돌림판 각도를 0으로 리셋 (구성 변경으로 인한 오류 방지)
    currentRotation = 0;
    
    updateItemsList();
    drawRoulette(); // 초기 상태로 돌림판 다시 그리기
    updateSpinButtonState();
    updateSaveFavoriteButton(); // 저장 버튼 상태 업데이트
    
    if (items.length === 0) {
        resultElement.textContent = '항목을 추가하고 돌림판을 돌려보세요!';
        resultElement.className = 'text-center text-lg text-gray-600 min-h-[3rem] flex items-center justify-center';
    }
    
    console.log(`➖ 항목 제거: "${removedItem}" (총 ${items.length}개)`);
    console.log(`🔄 돌림판 각도 리셋: currentRotation = 0`);
};

// 항목 목록 UI 업데이트
const updateItemsList = () => {
    itemsList.innerHTML = '';
    
    if (items.length === 0) {
        itemsList.innerHTML = '<span class="text-gray-400 text-sm">아직 추가된 항목이 없습니다.</span>';
        return;
    }
    
    items.forEach((item, index) => {
        const tag = document.createElement('div');
        tag.className = 'item-tag';
        tag.innerHTML = `
            <span>${item}</span>
            <button 
                class="remove-btn" 
                onclick="removeItem(${index})"
                aria-label="${item} 삭제"
                title="${item} 삭제"
            >
                ×
            </button>
        `;
        itemsList.appendChild(tag);
    });
    
    // 저장 버튼 상태 업데이트 (항목 목록이 변경되었으므로)
    updateSaveFavoriteButton();
};

// 돌리기 버튼 상태 업데이트
const updateSpinButtonState = () => {
    const shouldDisable = items.length === 0 || isSpinning;
    spinButton.disabled = shouldDisable;
    
    if (isSpinning) {
        spinButton.textContent = '돌리는 중...';
        spinButton.classList.add('animate-pulse');
    } else {
        spinButton.textContent = '돌리기! 🎯';
        spinButton.classList.remove('animate-pulse');
    }
};

// 화살표 상태 업데이트
const updateArrowState = (state) => {
    arrowPointer.classList.remove('spinning', 'result');
    
    if (state === 'spinning') {
        arrowPointer.classList.add('spinning');
    } else if (state === 'result') {
        arrowPointer.classList.add('result');
    }
};

// 결과 표시
const showResult = (selectedItem) => {
    resultElement.textContent = `🎯 결과: ${selectedItem}`;
    resultElement.className = 'text-center result-highlight min-h-[3rem] flex items-center justify-center';
    
    // 접근성을 위한 스크린 리더 알림
    setTimeout(() => {
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'assertive');
        announcement.textContent = `돌림판이 멈췄습니다! 선택된 항목은 ${selectedItem}입니다.`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, 100);
};

// 입력창 키 이벤트 처리
const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        addItem();
    }
};

// ===================================================================
// [6. 이벤트 리스너 연결 및 초기화]
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 캔버스 크기 초기화
    canvasInfo = initializeCanvas();
    
    // '추가', '돌리기!', '리셋' 버튼에 각각의 함수를 정확히 연결
    addButton.addEventListener('click', addItem);
    spinButton.addEventListener('click', spin);
    resetButton.addEventListener('click', reset);
    itemInput.addEventListener('keypress', handleKeyPress);
    
    // 즐겨찾기 관련 이벤트 리스너 연결
    saveFavoriteButton.addEventListener('click', saveFavorite);
    clearAllFavoritesButton.addEventListener('click', clearAllFavorites);
    favoriteNameInput.addEventListener('input', updateSaveFavoriteButton);
    favoriteNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            saveFavorite();
        }
    });
    
    // 화면 회전 및 리사이즈 대응
    window.addEventListener('resize', () => {
        setTimeout(() => {
            canvasInfo = initializeCanvas();
            drawRoulette();
        }, 100);
    });
    
    // 화면 방향 변경 대응
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            canvasInfo = initializeCanvas();
            drawRoulette();
        }, 300);
    });
    
    // 초기 상태 설정
    currentRotation = 0;
    isSpinning = false;
    preSelectedWinner = null;
    
    // 초기 UI 업데이트
    drawRoulette();
    updateItemsList();
    updateSpinButtonState();
    updateSaveFavoriteButton();
    updateFavoritesList();
    
    // 초기 포커스 (모바일에서는 자동 포커스 방지)
    if (window.innerWidth > 768) {
        itemInput.focus();
    }
    
    console.log(`🎪 === 돌림판 시스템 초기화 완료 ===`);
    console.log(`📱 모바일 최적화 완료 (터치 친화적 UI)`);
    console.log(`📐 수학적으로 완벽한 계산식 적용`);
    console.log(`🎯 완전 분리된 로직 (drawRoulette + spin + reset)`);
    console.log(`✅ 100% 정확한 결과 보장`);
    console.log(`🔄 리셋 기능 추가`);
    console.log(`💾 즐겨찾기 저장/불러오기 기능 추가`);
    console.log(`🚀 10바퀴 역동적 회전`);
    console.log(`📏 캔버스 크기: ${canvasInfo.centerX * 2}x${canvasInfo.centerY * 2}px`);
    console.log(`═══════════════════════════════════\n`);
});

// 전역 함수로 노출 (HTML에서 호출용)
window.removeItem = removeItem; 

// ===================================================================
// 🚀 서비스 워커 등록 (PWA 오프라인 지원)
// ===================================================================

// 브라우저가 서비스 워커를 지원하는지 확인 후 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('🚀 === 서비스 워커 등록 성공 ===');
                console.log(`📡 스코프: ${registration.scope}`);
                console.log('💾 오프라인 캐싱 활성화됨');
                console.log('🏠 홈 화면 추가 기능 지원');
                
                // 서비스 워커 업데이트 감지
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 새로운 서비스 워커 업데이트 감지');
                });
            })
            .catch((error) => {
                console.warn('⚠️ 서비스 워커 등록 실패:', error);
                console.log('📱 일반 웹앱 모드로 계속 진행');
            });
    });
} else {
    console.log('📱 이 브라우저는 서비스 워커를 지원하지 않습니다');
    console.log('🌐 일반 웹 브라우저 모드로 작동합니다');
}

// ===================================================================
// 🔗 간편 링크 복사 기능
// ===================================================================

// 공유 버튼 요소 가져오기
const shareButton = document.getElementById('share-button');

// 공유 버튼 클릭 이벤트 (클립보드 복사)
shareButton.addEventListener('click', async () => {
    try {
        // 현재 페이지 URL 복사
        const currentUrl = window.location.href;
        
        if (navigator.clipboard) {
            // 모던 브라우저: Clipboard API 사용
            await navigator.clipboard.writeText(currentUrl);
            showCopySuccess();
            console.log('📋 클립보드 복사 성공:', currentUrl);
        } else {
            // 구형 브라우저: 수동 복사
            const textArea = document.createElement('textarea');
            textArea.value = currentUrl;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopySuccess();
            console.log('📋 수동 복사 성공:', currentUrl);
        }
    } catch (error) {
        console.warn('⚠️ 클립보드 복사 실패:', error);
        // 복사 실패 시 URL을 직접 보여주기
        alert(`링크 복사에 실패했습니다.\n아래 주소를 직접 복사해주세요:\n\n${window.location.href}`);
    }
});

// 복사 성공 알림 표시
const showCopySuccess = () => {
    // 시각적 피드백을 위해 버튼 색상 잠시 변경
    const originalClass = shareButton.className;
    shareButton.className = shareButton.className.replace('bg-blue-500', 'bg-green-500');
    shareButton.className = shareButton.className.replace('hover:bg-blue-600', 'hover:bg-green-600');
    
    // 버튼 텍스트 잠시 변경
    const buttonText = shareButton.querySelector('span:last-child');
    const originalText = buttonText.textContent;
    buttonText.textContent = '복사됨!';
    
    // 성공 메시지
    alert('🔗 링크가 복사되었습니다!\n메신저나 다른 앱에서 붙여넣기하여 공유해보세요.');
    
    // 1.5초 후 원래 상태로 복원
    setTimeout(() => {
        shareButton.className = originalClass;
        buttonText.textContent = originalText;
    }, 1500);
};

console.log('🔗 링크 복사 기능 활성화됨 - 모든 브라우저 지원');