document.addEventListener('DOMContentLoaded', function () {
    const startSection = document.getElementById('start');
    const howSection = document.getElementById('how');
    const completedSection = document.getElementById('completed');
    const gameOverSection = document.getElementById('game-over');
    const resetButton = document.getElementById('reset-button');

    const startButtons = document.querySelectorAll('.start');
    const howButtons = document.querySelectorAll('.how');
    const undoButtons = document.querySelectorAll('.undo-container');

    const levels = Array.from(document.querySelectorAll('.level'));
    let currentLevelIndex = 0;
    let timerInterval = null;

    let isInteractionDisabled = false; // Flag to disable interaction

    function checkOrientation() {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        const rotateSection = document.getElementById('rotate');

        if (isPortrait && isMobileDevice()) {
            // Show the rotate section
            rotateSection.style.display = 'flex';
            document.body.classList.add('no-scroll');
        } else {
            // Hide the rotate section
            rotateSection.style.display = 'none';
            document.body.classList.remove('no-scroll');
        }
    }

    function isMobileDevice() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    // Initial check
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);


    function hideAllSections() {
        startSection.style.display = 'none';
        howSection.style.display = 'none';
        completedSection.style.display = 'none';
        gameOverSection.style.display = 'none';
        levels.forEach(level => {
            level.style.display = 'none';
        });
    }

    function showSection(section) {
        section.style.display = 'block';
    }

    window.currentlyDraggedItem = null;
    window.dragOffsetX = 0;
    window.dragOffsetY = 0;
    window.previousMouseX = 0; // For tracking mouse movement direction
    window.previousTouchX = 0; // For touch events

    function handleMouseDown(e) {
        if (isInteractionDisabled) {
            e.preventDefault();
            return;
        }
        const draggedItem = this;

        const rect = draggedItem.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        draggedItem.style.zIndex = 1000;

        window.previousMouseX = e.clientX;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        e.preventDefault();

        window.currentlyDraggedItem = draggedItem;
        window.dragOffsetX = offsetX;
        window.dragOffsetY = offsetY;
    }

    function handleTouchStart(e) {
        if (isInteractionDisabled) {
            e.preventDefault();
            return;
        }
        const draggedItem = this;

        const touch = e.touches[0];

        const rect = draggedItem.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        draggedItem.style.zIndex = 1000;

        window.previousTouchX = touch.clientX;

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
        const container = levelSection.querySelector('.container');
        const containerRect = container.getBoundingClientRect();

        let newLeft = e.clientX - containerRect.left - window.dragOffsetX + (draggedItem.offsetWidth / 2);
        let newTop = e.clientY - containerRect.top - window.dragOffsetY + (draggedItem.offsetHeight / 2);

        newLeft = Math.max(0, Math.min(newLeft, container.clientWidth));
        newTop = Math.max(0, Math.min(newTop, container.clientHeight));

        draggedItem.style.left = `${newLeft}px`;
        draggedItem.style.top = `${newTop}px`;

        // Determine movement direction
        const deltaX = e.clientX - window.previousMouseX;
        window.previousMouseX = e.clientX;

        let rotationAdjustment = 0;

        if (deltaX > 0) {
            // Mouse moved right
            rotationAdjustment = -9;
        } else if (deltaX < 0) {
            // Mouse moved left
            rotationAdjustment = 9;
        } else {
            rotationAdjustment = 0;
        }

        const initialRotation = parseFloat(draggedItem.dataset.initialRotation) || 0;
        const totalRotation = initialRotation + rotationAdjustment;

        // Apply both translate and rotate transformations
        draggedItem.style.transform = `translate(-50%, -50%) rotate(${totalRotation}deg)`;
    }

    function onTouchMove(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        const touch = e.touches[0];

        const levelSection = draggedItem.closest('.level');
        const container = levelSection.querySelector('.container');
        const containerRect = container.getBoundingClientRect();

        let newLeft = touch.clientX - containerRect.left - window.dragOffsetX + (draggedItem.offsetWidth / 2);
        let newTop = touch.clientY - containerRect.top - window.dragOffsetY + (draggedItem.offsetHeight / 2);

        newLeft = Math.max(0, Math.min(newLeft, container.clientWidth));
        newTop = Math.max(0, Math.min(newTop, container.clientHeight));

        draggedItem.style.left = `${newLeft}px`;
        draggedItem.style.top = `${newTop}px`;

        // Determine movement direction
        const deltaX = touch.clientX - window.previousTouchX;
        window.previousTouchX = touch.clientX;

        let rotationAdjustment = 0;

        if (deltaX > 0) {
            // Touch moved right
            rotationAdjustment = -9;
        } else if (deltaX < 0) {
            // Touch moved left
            rotationAdjustment = 9;
        } else {
            rotationAdjustment = 0;
        }

        const initialRotation = parseFloat(draggedItem.dataset.initialRotation) || 0;
        const totalRotation = initialRotation + rotationAdjustment;

        // Apply both translate and rotate transformations
        draggedItem.style.transform = `translate(-50%, -50%) rotate(${totalRotation}deg)`;

        e.preventDefault();
    }

    function onMouseUp(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        draggedItem.style.zIndex = '';

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Reset rotation to initial rotation and keep translate
        const initialRotation = parseFloat(draggedItem.dataset.initialRotation) || 0;
        draggedItem.style.transform = `translate(-50%, -50%) rotate(${initialRotation}deg)`;

        window.currentlyDraggedItem = null;

        processPlacement(draggedItem);
    }

    function onTouchEnd(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        draggedItem.style.zIndex = '';

        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);

        // Reset rotation to initial rotation and keep translate
        const initialRotation = parseFloat(draggedItem.dataset.initialRotation) || 0;
        draggedItem.style.transform = `translate(-50%, -50%) rotate(${initialRotation}deg)`;

        window.currentlyDraggedItem = null;

        processPlacement(draggedItem);
    }

    function processPlacement(draggedItem) {
        const levelSection = draggedItem.closest('.level');

        // If interaction is disabled, do not process placements
        if (isInteractionDisabled || levelSection.classList.contains('passed-level')) {
            return;
        }

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
            if (draggedItem.classList.contains('correctly-placed')) {
                draggedItem.classList.remove('correctly-placed');
            }
        }

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
        levelSection.dataset.correctPlacements = 0;

        const items = levelSection.querySelectorAll('.items .item, .actual-bin .item');
        const binContainers = levelSection.querySelectorAll('.bins .bin-container');

        const baseTime = 90;
        const timeReduction = 15;
        const totalTime = Math.max(15, baseTime - timeReduction * currentLevelIndex);
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
            disableDragging();
            showGameOverMessage();
        }

        function disableDragging() {
            items.forEach(item => {
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
                resetGame();
            }, 2000);
        }

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
                return;
            }

            const actualBin = targetBinEntry.querySelector('.actual-bin');

            if (isItemInCorrectBin(item, { binNumber: correctBinNumber, actualBin })) {
                item.classList.add('correctly-placed');
                console.log(`Item "${item.id}" is already placed in bin ${correctBinNumber}.`);
            }

            // Assign random initial rotation between -8 and +8 degrees
            const initialRotation = Math.random() * 16 - 8; // (-8 to +8)
            item.dataset.initialRotation = initialRotation;

            // Apply both translate and rotate transformations
            item.style.transform = `translate(-50%, -50%) rotate(${initialRotation}deg)`;

            item.style.cursor = 'grab';
            item.addEventListener('mousedown', handleMouseDown);
            item.addEventListener('touchstart', handleTouchStart, { passive: false });
        });

        startTimer();
    }

    function isItemInCorrectBin(item, binEntry) {
        const itemRect = item.getBoundingClientRect();
        const binRect = binEntry.actualBin.getBoundingClientRect();
        return isOverlapping(itemRect, binRect);
    }

    function gameCompleted() {
        const currentLevel = levels[currentLevelIndex];
        const levelNumber = currentLevelIndex + 1;
        const levelSpan = completedSection.querySelector('.level-span');
        const secondsSpan = completedSection.querySelector('.seconds-span');

        // Remove grayscale from all items
        currentLevel.querySelectorAll(".grayed-out").forEach(gr => {
            gr.classList.add("not-gray");
        });

        // Clear the timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        const timerText = currentLevel.querySelector('.actual-timer').textContent;
        const timeParts = timerText.split(':');
        const minutes = parseInt(timeParts[0]);
        const seconds = parseInt(timeParts[1].replace('s', ''));
        const timeTaken = 90 - (15 * (currentLevelIndex)) - (minutes * 60) - seconds;

        levelSpan.textContent = `${levelNumber}${getOrdinalSuffix(levelNumber)} level`;
        secondsSpan.textContent = `${timeTaken}`;

        // Disable interaction when the level is completed
        isInteractionDisabled = true;

        // Show 'completed' section for 2 seconds
        setTimeout(() => {
            hideAllSections();
            showSection(completedSection);

            // After 2 seconds, hide 'completed' section and show the level section with .passed-level class added
            setTimeout(() => {
                hideAllSections();
                showSection(currentLevel);

                currentLevel.classList.add('passed-level');

                // Add click event listeners to .top-thing items
                const topThings = currentLevel.querySelectorAll('.top-thing');
                topThings.forEach(topThing => {
                    topThing.addEventListener('click', function() {
                        topThing.classList.toggle('activated');
                    });
                });

            }, 2000);

        }, 2000);
    }

    function getOrdinalSuffix(n) {
        const s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

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

                item.style.transform = ''; // Reset transform
                item.style.zIndex = '';

                item.removeEventListener('mousedown', handleMouseDown);
                item.removeEventListener('touchstart', handleTouchStart);
                item.addEventListener('mousedown', handleMouseDown);
                item.addEventListener('touchstart', handleTouchStart, { passive: false });
            });

            level.querySelectorAll(".grayed-out").forEach(gr => {
                gr.classList.remove("not-gray");
            });

            binContainers.forEach(bin => {
                bin.querySelector('.actual-bin').classList.remove('shake');
            });

            level.style.display = 'none';
            level.classList.remove('passed-level');

            // Remove event listeners from .top-thing items
            const topThings = level.querySelectorAll('.top-thing');
            topThings.forEach(topThing => {
                topThing.classList.remove('activated');
                topThing.replaceWith(topThing.cloneNode(true));
            });
        });

        if (completedSection) {
            completedSection.style.display = 'none';
            completedSection.querySelector('div').textContent = '';
        }

        if (gameOverSection) {
            gameOverSection.style.display = 'none';
        }

        currentLevelIndex = 0;

        isInteractionDisabled = false; // Reset interaction flag
    }

    function startGame() {
        hideAllSections();
        if (levels.length > 0) {
            initializeLevel(levels[currentLevelIndex]);
        } else {
            // Handle case where there are no levels
        }
    }

    function showHowToPlay() {
        hideAllSections();
        showSection(howSection);
    }

    function backToStart() {
        hideAllSections();
        showSection(startSection);
        resetGame();
    }

    function proceedToNextLevel() {
        const currentLevel = levels[currentLevelIndex];
        currentLevel.classList.remove('passed-level');

        if (currentLevelIndex < levels.length - 1) {
            currentLevelIndex++;
            const nextLevel = levels[currentLevelIndex];

            hideAllSections();
            initializeLevel(nextLevel);
            isInteractionDisabled = false; // Re-enable interaction for the new level
        } else {
            hideAllSections();
            showSection(startSection);
            resetGame();
        }
    }

    // Add event listeners for navigation
    startButtons.forEach(button => {
        button.addEventListener('click', startGame);
    });

    howButtons.forEach(button => {
        button.addEventListener('click', showHowToPlay);
    });

    // Update the undo button event listener
    undoButtons.forEach(button => {
        button.addEventListener('click', () => {
            location.reload(); // Refresh the page when undo is clicked
        });
    });

    // Add event listeners to 'next' buttons
    const nextButtons = document.querySelectorAll('.next');
    nextButtons.forEach(button => {
        button.addEventListener('click', proceedToNextLevel);
    });

    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }

    hideAllSections();
    showSection(startSection);
});
