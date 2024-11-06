document.addEventListener('DOMContentLoaded', function () {
    // Секциски елементи
    const startSection = document.getElementById('start');
    const howSection = document.getElementById('how');
    const completedSection = document.getElementById('completed');
    const gameOverSection = document.getElementById('game-over'); // Додадено за крај на играта
    const resetButton = document.getElementById('reset-button'); // Осигурајте дека постои во вашиот HTML

    // Бутонки
    const startButtons = document.querySelectorAll('.start'); // "Start Game" бутони во различни секции
    const howButtons = document.querySelectorAll('.how'); // "How to Play" бутони
    const backButtons = document.querySelectorAll('.undo-container, .back-button'); // "Back" бутони во How секцијата

    // Секциите за нивои
    const levels = Array.from(document.querySelectorAll('.level')); // Собирајте ги сите секции за ниво
    let currentLevelIndex = 0; // Следење на тековното ниво
    let timerInterval = null; // За складирање на интервалот за тајмерот

    // Функција за скривање на сите секции
    function hideAllSections() {
        startSection.style.display = 'none';
        howSection.style.display = 'none';
        completedSection.style.display = 'none';
        gameOverSection.style.display = 'none'; // Скријте ја секцијата за крај на играта
        levels.forEach(level => {
            level.style.display = 'none';
        });
    }

    // Функција за прикажување на специфична секција
    function showSection(section) {
        section.style.display = 'block';
    }

    // Глобални променливи за следење на движењето на објекти
    window.currentlyDraggedItem = null;
    window.dragOffsetX = 0;
    window.dragOffsetY = 0;

    // Функции за ракување со мишот и допир
    function handleMouseDown(e) {
        const draggedItem = this;

        const rect = draggedItem.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        draggedItem.style.transform = 'none';
        draggedItem.style.zIndex = 1000;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        e.preventDefault();

        window.currentlyDraggedItem = draggedItem;
        window.dragOffsetX = offsetX;
        window.dragOffsetY = offsetY;
    }

    function handleTouchStart(e) {
        const draggedItem = this;

        const touch = e.touches[0];

        const rect = draggedItem.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        draggedItem.style.transform = 'none';
        draggedItem.style.zIndex = 1000;

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);

        e.preventDefault();

        window.currentlyDraggedItem = draggedItem;
        window.dragOffsetX = offsetX;
        window.dragOffsetY = offsetY;
    }

    function onMouseMove(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        const levelSection = draggedItem.closest('.level');
        const levelRect = levelSection.getBoundingClientRect();
        let newLeft = e.clientX - levelRect.left - window.dragOffsetX;
        let newTop = e.clientY - levelRect.top - window.dragOffsetY;

        newLeft = Math.max(0, Math.min(newLeft, levelSection.clientWidth - draggedItem.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, levelSection.clientHeight - draggedItem.offsetHeight));

        draggedItem.style.left = `${newLeft}px`;
        draggedItem.style.top = `${newTop}px`;
    }

    function onTouchMove(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        const touch = e.touches[0];

        const levelSection = draggedItem.closest('.level');
        const levelRect = levelSection.getBoundingClientRect();
        let newLeft = touch.clientX - levelRect.left - window.dragOffsetX;
        let newTop = touch.clientY - levelRect.top - window.dragOffsetY;

        newLeft = Math.max(0, Math.min(newLeft, levelSection.clientWidth - draggedItem.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, levelSection.clientHeight - draggedItem.offsetHeight));

        draggedItem.style.left = `${newLeft}px`;
        draggedItem.style.top = `${newTop}px`;

        e.preventDefault();
    }

    function onMouseUp(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        draggedItem.style.zIndex = '';

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        window.currentlyDraggedItem = null;

        processPlacement(draggedItem);
    }

    function onTouchEnd(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        draggedItem.style.zIndex = '';

        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);

        window.currentlyDraggedItem = null;

        processPlacement(draggedItem);
    }

    // Функција за обработка на поставувањето на објектот по движење
    function processPlacement(draggedItem) {
        const levelSection = draggedItem.closest('.level');
        const binContainers = levelSection.querySelectorAll('.bins .bin-container');

        const binMap = Array.from(binContainers).map(binContainer => {
            const binNumber = parseInt(binContainer.getAttribute('data-bin'));
            const actualBin = binContainer.querySelector('.actual-bin');
            return { binNumber, actualBin };
        });

        let correctBinNumber = null;
        const itemClasses = Array.from(draggedItem.classList);
        itemClasses.forEach(cls => {
            if (cls.startsWith('c')) {
                const binNum = parseInt(cls.substring(1));
                if (!isNaN(binNum)) {
                    correctBinNumber = binNum;
                }
            }
        });

        if (!correctBinNumber) {
            return;
        }

        const targetBinEntry = binMap.find(entry => entry.binNumber === correctBinNumber);
        if (!targetBinEntry) {
            console.log(`Нема сад со data-bin="${correctBinNumber}" за објектот "${draggedItem.id}".`);
            return;
        }

        const targetBin = targetBinEntry.actualBin;
        if (!targetBin) {
            return;
        }

        const itemRect = draggedItem.getBoundingClientRect();
        const binRect = targetBin.getBoundingClientRect();

        if (isOverlapping(itemRect, binRect)) {
            if (!draggedItem.classList.contains('correctly-placed')) {
                draggedItem.classList.add('correctly-placed');
            }
        } else {
            // Отстрани класа ако не е правилно поставено
            if (draggedItem.classList.contains('correctly-placed')) {
                draggedItem.classList.remove('correctly-placed');
            }

            binMap.forEach(binEntry => {
                if (binEntry.binNumber === correctBinNumber) return; // Прескокнете го точниот сад

                if (!binEntry.actualBin) {
                    return;
                }

                const otherBinRect = binEntry.actualBin.getBoundingClientRect();

                if (isOverlapping(itemRect, otherBinRect)) {

                }
            });
        }

        // Проверете дали сите објекти се правилно поставени
        const allItems = levelSection.querySelectorAll('.items .item');
        const allCorrect = Array.from(allItems).every(item => item.classList.contains('correctly-placed'));

        if (allCorrect) {
            gameCompleted();
        }
    }

    function isOverlapping(rect1, rect2) {
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    function initializeLevel(levelSection) {
        levelSection.style.display = 'block';
        levelSection.dataset.correctPlacements = 0; // Инитилизирате бројот на правилно поставени објекти

        const items = levelSection.querySelectorAll('.items .item, .actual-bin .item'); // Изберете ги сите објекти во тековното ниво
        const binContainers = levelSection.querySelectorAll('.bins .bin-container');

        // Таймер
        const baseTime = 90;
        const timeReduction = 15;
        const totalTime = Math.max(15, baseTime - timeReduction * currentLevelIndex); // Минимално 15 секунди
        let timeRemaining = totalTime;

        const actualTimer = levelSection.querySelector('.actual-timer');

        function startTimer() {
            timeRemaining = totalTime;
            updateTimerDisplay();

            if (timerInterval) {
                clearInterval(timerInterval);
            }

            timerInterval = setInterval(() => {
                timeRemaining--;
                updateTimerDisplay();

                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    endGameDueToTimeOut();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;

            const formattedMinutes = minutes.toString();
            const formattedSeconds = seconds.toString().padStart(2, '0');

            actualTimer.textContent = `${formattedMinutes}:${formattedSeconds}s`;

            if (timeRemaining <= 10) {
                actualTimer.style.color = 'red';
            } else {
                actualTimer.style.color = 'black';
            }
        }

        function endGameDueToTimeOut() {
            disableDragging(); // Деактивирајте движењето
            showGameOverMessage();
        }

        function disableDragging() {
            items.forEach(item => {
                // Отстрани класата која ги спречува движењето
                // Не додавајте 'placed' класа, бидејќи сакаме да ги дозволиме движењето
                item.classList.remove('placed');
                item.style.cursor = 'grab';
            });
        }

        function showGameOverMessage() {
            hideAllSections();
            showSection(gameOverSection);

            setTimeout(() => {
                hideAllSections();
                showSection(startSection);
            }, 2000); // 2 секунди
        }

        // Иницијализација на движење на објекти
        items.forEach((item, index) => {
            if (!item.id) {
                item.id = `item-${currentLevelIndex + 1}-${index + 1}`;
            }

            if (!item.dataset.originalLeft) {
                item.dataset.originalLeft = `${item.offsetLeft}px`;
            }
            if (!item.dataset.originalTop) {
                item.dataset.originalTop = `${item.offsetTop}px`;
            }

            let correctBinNumber = null;
            const itemClasses = Array.from(item.classList);
            itemClasses.forEach(cls => {
                if (cls.startsWith('c')) {
                    const binNum = parseInt(cls.substring(1));
                    if (!isNaN(binNum)) {
                        correctBinNumber = binNum;
                    }
                }
            });

            if (!correctBinNumber) {
                return;
            }

            const targetBinEntry = Array.from(binContainers).find(entry => parseInt(entry.getAttribute('data-bin')) === correctBinNumber);
            if (!targetBinEntry) {
                console.log(`Нема сад со data-bin="${correctBinNumber}" за објектот "${item.id}".`);
                return;
            }

            const actualBin = targetBinEntry.querySelector('.actual-bin');

            // Проверете дали објектот е веќе поставен правилно
            if (isItemInCorrectBin(item, { binNumber: correctBinNumber, actualBin })) {
                item.classList.add('correctly-placed');
                console.log(`Објектот "${item.id}" е претходно поставен во сад ${correctBinNumber}.`);
            }

            // Додајте наслушувачи за движење без оглед на поставување
            item.style.cursor = 'grab'; // Осигурете дека курсорот покажува дека е движење
            item.addEventListener('mousedown', handleMouseDown);
            item.addEventListener('touchstart', handleTouchStart, { passive: false });
        });

        // Почнете ја таймерот за тековното ниво
        startTimer();
    }

    // Функција за проверка дали објектот е во точниот сад
    function isItemInCorrectBin(item, binEntry) {
        const itemRect = item.getBoundingClientRect();
        const binRect = binEntry.actualBin.getBoundingClientRect();
        return isOverlapping(itemRect, binRect);
    }

    // Функција за обработка на победа
    function gameCompleted() {
        const currentLevel = levels[currentLevelIndex];
        const levelNumber = currentLevelIndex + 1;
        const levelSpan = completedSection.querySelector('.level-span');
        const secondsSpan = completedSection.querySelector('.seconds-span');

        // Отстрани Грејскале од сите објекти
        currentLevel.querySelectorAll(".grayed-out").forEach(gr => {
            gr.classList.add("not-gray");
        });

        // Исчистете ја таймерот
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Пресметајте го времето
        const timerText = currentLevel.querySelector('.actual-timer').textContent;
        const timeParts = timerText.split(':');
        const minutes = parseInt(timeParts[0]);
        const seconds = parseInt(timeParts[1].replace('s', ''));
        const timeTaken = (minutes * 60) + seconds;

        // Ажурирајте ја победната порака
        levelSpan.textContent = `${levelNumber}${getOrdinalSuffix(levelNumber)} level`;
        secondsSpan.textContent = `${timeTaken}`;

        // Покажете ја победната секција
        setTimeout(() => {
            hideAllSections();
            showSection(completedSection);

            // Преминете на следното ниво или завршете ја играта
            setTimeout(() => {
                hideAllSections();

                if (currentLevelIndex < levels.length - 1) {
                    currentLevelIndex++;
                    const nextLevel = levels[currentLevelIndex];
                    initializeLevel(nextLevel);
                } else {
                    // Завршете ја играта
                    setTimeout(() => {
                        hideAllSections();
                        showSection(startSection);
                        resetGame();
                    }, 2000); // 2 секунди
                }
            }, 2000); // 2 секунди за победната порака
        }, 2000); // 2 секунди паузата пред да се покаже победната порака
    }

    // Помошна функција за добивање на суфикс за бројевите
    function getOrdinalSuffix(n) {
        const s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Функција за ресетирање на играта
    function resetGame() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        levels.forEach((level, index) => {
            const items = level.querySelectorAll('.items .item, .actual-bin .item');
            const binContainers = level.querySelectorAll('.bins .bin-container');

            items.forEach(item => {
                item.style.left = item.dataset.originalLeft;
                item.style.top = item.dataset.originalTop;

                item.classList.remove('correctly-placed');
                item.style.cursor = 'grab';

                item.style.transform = '';
                item.style.zIndex = '';

                item.removeEventListener('mousedown', handleMouseDown);
                item.removeEventListener('touchstart', handleTouchStart);
                item.addEventListener('mousedown', handleMouseDown);
                item.addEventListener('touchstart', handleTouchStart, { passive: false });
            });

            binContainers.forEach(bin => {
                bin.querySelector('.actual-bin').classList.remove('shake');
            });

            level.style.display = 'none';
        });

        if (completedSection) {
            completedSection.style.display = 'none';
            completedSection.querySelector('div').textContent = ''; // Исчистете ги пораките
        }

        if (gameOverSection) {
            gameOverSection.style.display = 'none';
        }

        currentLevelIndex = 0;

        hideAllSections();
        showSection(startSection);

    }

    // Додадени наслушувачи на настани за навигација
    function startGame() {
        hideAllSections();
        if (levels.length > 0) {
            initializeLevel(levels[currentLevelIndex]);
        } else {
        }
    }

    function showHowToPlay() {
        hideAllSections();
        showSection(howSection);
    }

    function backToStart() {
        hideAllSections();
        showSection(startSection);
    }

    startButtons.forEach(button => {
        button.addEventListener('click', startGame);
    });

    howButtons.forEach(button => {
        button.addEventListener('click', showHowToPlay);
    });

    backButtons.forEach(button => {
        button.addEventListener('click', backToStart);
    });

    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }

    hideAllSections();
    showSection(startSection);
});
