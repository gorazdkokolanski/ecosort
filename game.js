document.addEventListener('DOMContentLoaded', function () {
    // Section Elements
    const startSection = document.getElementById('start');
    const howSection = document.getElementById('how');
    const completedSection = document.getElementById('completed');
    const gameOverSection = document.getElementById('game-over'); // Added for game over
    const resetButton = document.getElementById('reset-button'); // Ensure this exists in your HTML

    // Buttons
    const startButtons = document.querySelectorAll('.start'); // "Start Game" buttons in various sections
    const howButtons = document.querySelectorAll('.how'); // "How to Play" buttons
    const backButtons = document.querySelectorAll('.undo-container, .back-button'); // "Back" buttons in How section

    // Level Sections
    const levels = Array.from(document.querySelectorAll('.level')); // Collect all level sections
    let currentLevelIndex = 0; // Track the current level
    let timerInterval = null; // To store the timer interval

    // Function to Hide All Sections Except Completed and Game Over
    function hideAllSections() {
        startSection.style.display = 'none';
        howSection.style.display = 'none';
        completedSection.style.display = 'none';
        gameOverSection.style.display = 'none'; // Hide game over section
        levels.forEach(level => {
            level.style.display = 'none';
        });
    }

    // Function to Show a Specific Section
    function showSection(section) {
        section.style.display = 'block';
    }

    // ----------------------------
    // Define the Mouse Down Handler Separately
    // ----------------------------
    function handleMouseDown(e) {
        const draggedItem = this;

        // Calculate the Mouse Position Relative to the Item
        const rect = draggedItem.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        // Remove Any Transform
        draggedItem.style.transform = 'none';

        // Bring the Dragged Item to the Front
        draggedItem.style.zIndex = 1000;

        // Add Event Listeners for Mousemove and Mouseup
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Prevent Default to Avoid Text Selection
        e.preventDefault();

        // Current dragged item and offsets are stored globally for accessibility in onMouseMove and onMouseUp
        window.currentlyDraggedItem = draggedItem;
        window.dragOffsetX = offsetX;
        window.dragOffsetY = offsetY;
    }

    // Global variables to track the dragged item and its offset
    window.currentlyDraggedItem = null;
    window.dragOffsetX = 0;
    window.dragOffsetY = 0;

    // Function to Handle Mouse Move
    function onMouseMove(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        // Calculate New Position Relative to the Level Section
        const levelSection = draggedItem.closest('.level');
        const levelRect = levelSection.getBoundingClientRect();
        let newLeft = e.clientX - levelRect.left - window.dragOffsetX;
        let newTop = e.clientY - levelRect.top - window.dragOffsetY;

        // Optional: Restrict the Item Within the Level Section Boundaries
        newLeft = Math.max(0, Math.min(newLeft, levelSection.clientWidth - draggedItem.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, levelSection.clientHeight - draggedItem.offsetHeight));

        // Update the Item's Position
        draggedItem.style.left = `${newLeft}px`;
        draggedItem.style.top = `${newTop}px`;
    }

    // Function to Handle Mouse Up
    function onMouseUp(e) {
        const draggedItem = window.currentlyDraggedItem;
        if (!draggedItem) return;

        // Reset z-index
        draggedItem.style.zIndex = '';

        // Remove Event Listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Clear the Dragged Item
        window.currentlyDraggedItem = null;

        // Find the corresponding level section
        const levelSection = draggedItem.closest('.level');
        const binContainers = levelSection.querySelectorAll('.bins .bin-container');

        // Create binMap for this level
        const binMap = Array.from(binContainers).map(binContainer => {
            const binNumber = parseInt(binContainer.getAttribute('data-bin'));
            const actualBin = binContainer.querySelector('.actual-bin');
            return { binNumber, actualBin };
        });

        // Determine the Correct Bin Number for the Dragged Item
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
            console.log(`Item "${draggedItem.id}" does not have a valid class to determine the correct bin.`);
            return; // No correct bin found
        }

        // Find the Corresponding Actual-Bin
        const targetBinEntry = binMap.find(entry => entry.binNumber === correctBinNumber);
        if (!targetBinEntry) {
            console.log(`No bin found with data-bin="${correctBinNumber}" for item "${draggedItem.id}".`);
            return; // No matching bin found
        }

        const targetBin = targetBinEntry.actualBin;
        if (!targetBin) {
            console.log(`Actual bin element missing for data-bin="${correctBinNumber}".`);
            return;
        }

        const itemRect = draggedItem.getBoundingClientRect();
        const binRect = targetBin.getBoundingClientRect();

        if (isOverlapping(itemRect, binRect)) {
            // **Check if the Item is Already Placed**
            if (!draggedItem.classList.contains('placed')) {
                // Mark as Placed
                draggedItem.classList.add('placed');
                draggedItem.style.cursor = 'default';

                // **Increment the Correct Placements Counter Only Once**
                levelSection.dataset.correctPlacements = parseInt(levelSection.dataset.correctPlacements || '0') + 1;

                console.log(`Item "${draggedItem.id}" placed correctly in bin ${correctBinNumber}.`);

                // **Disable Further Dragging**
                disableItemDragging(draggedItem);

                // Check if All Items Are Placed Correctly
                if (parseInt(levelSection.dataset.correctPlacements) === levelSection.querySelectorAll('.items .item').length) {
                    gameCompleted();
                }
            } else {
                // Item is already placed; do nothing
            }
        } else {
            // **Check if the Item Overlaps with Any Other Actual-Bin (Incorrect Placement)**
            binMap.forEach(binEntry => {
                if (binEntry.binNumber === correctBinNumber) return; // Skip the correct bin

                if (!binEntry.actualBin) {
                    console.log(`Actual bin element missing for data-bin="${binEntry.binNumber}".`);
                    return;
                }

                const otherBinRect = binEntry.actualBin.getBoundingClientRect();

                if (isOverlapping(itemRect, otherBinRect)) {
                    console.log(`Item "${draggedItem.id}" is placed in incorrect bin ${binEntry.binNumber}. Correct bin is ${correctBinNumber}.`);

                    // Trigger Visual Feedback (e.g., Shake Animation)
                    binEntry.actualBin.classList.add('shake');
                    setTimeout(() => {
                        binEntry.actualBin.classList.remove('shake');
                    }, 500);

                    // Animate Back to Original Position
                    draggedItem.style.left = draggedItem.dataset.originalLeft;
                    draggedItem.style.top = draggedItem.dataset.originalTop;
                }
            });
        }
    }

    // Function to Check if Two Rectangles Overlap
    function isOverlapping(rect1, rect2) {
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    // Function to Initialize a Specific Level
    function initializeLevel(levelSection) {
        // Ensure the level is visible
        levelSection.style.display = 'block';
        levelSection.dataset.correctPlacements = 0; // Initialize correct placements

        const items = levelSection.querySelectorAll('.items .item, .actual-bin .item'); // Select all items in the current level
        const binContainers = levelSection.querySelectorAll('.bins .bin-container');
        let correctPlacements = 0;

        // ----------------------------
        // Timer Variables and Functions
        // ----------------------------

        // Dynamic Total Time: 90 - 15 * currentLevelIndex
        const baseTime = 90;
        const timeReduction = 15;
        const totalTime = Math.max(15, baseTime - timeReduction * currentLevelIndex); // Minimum 15 seconds
        let timeRemaining = totalTime;

        // Select the actual-timer div within the current level
        const actualTimer = levelSection.querySelector('.actual-timer');

        // Function to Start the Timer
        function startTimer() {
            // Initialize timeRemaining
            timeRemaining = totalTime;
            updateTimerDisplay();

            // Clear any existing interval
            if (timerInterval) {
                clearInterval(timerInterval);
            }

            // Start the countdown
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateTimerDisplay();

                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    endGameDueToTimeOut();
                }
            }, 1000);
        }

        // Function to Update the Timer Display
        function updateTimerDisplay() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;

            // Format minutes and seconds to have leading zeros if needed
            const formattedMinutes = minutes.toString();
            const formattedSeconds = seconds.toString().padStart(2, '0');

            actualTimer.textContent = `${formattedMinutes}:${formattedSeconds}s`;

            // Change color when time is running low (e.g., last 10 seconds)
            if (timeRemaining <= 10) {
                actualTimer.style.color = 'red';
            } else {
                actualTimer.style.color = 'black';
            }
        }

        // Function to End the Game Due to Timeout
        function endGameDueToTimeOut() {
            disableDragging(); // Disable dragging
            showGameOverMessage();
        }

        // Function to Disable Dragging of All Items
        function disableDragging() {
            items.forEach(item => {
                item.classList.add('placed'); // Mark as placed to prevent dragging
                item.style.cursor = 'default';
            });
        }

        // Function to Show "Game Over" Message
        function showGameOverMessage() {
            hideAllSections();
            showSection(gameOverSection);

            // Pause for 2 seconds before navigating back to start
            setTimeout(() => {
                hideAllSections();
                showSection(startSection);
            }, 2000); // 2000 milliseconds = 2 seconds
        }

        // ----------------------------
        // Initialize Draggable Items and Mark Pre-Placed Items
        // ----------------------------
        items.forEach((item, index) => {
            // Assign a Unique ID if Not Present
            if (!item.id) {
                item.id = `item-${currentLevelIndex + 1}-${index + 1}`;
            }

            // Store Original Positions
            if (!item.dataset.originalLeft) {
                item.dataset.originalLeft = `${item.offsetLeft}px`;
            }
            if (!item.dataset.originalTop) {
                item.dataset.originalTop = `${item.offsetTop}px`;
            }

            // Determine the Correct Bin Number from the Item's Class
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
                console.log(`Item "${item.id}" does not have a valid class to determine the correct bin.`);
                return; // Skip items without a valid c-class
            }

            // Find the Corresponding Bin Entry
            const targetBinEntry = Array.from(binContainers).find(entry => parseInt(entry.getAttribute('data-bin')) === correctBinNumber);
            if (!targetBinEntry) {
                console.log(`No bin found with data-bin="${correctBinNumber}" for item "${item.id}".`);
                return; // Skip if corresponding bin is not found
            }

            const actualBin = targetBinEntry.querySelector('.actual-bin');

            // Check if the Item is Already Inside Its Correct Bin
            if (isItemInCorrectBin(item, { binNumber: correctBinNumber, actualBin })) {
                // Mark as Placed
                item.classList.add('placed');
                item.style.cursor = 'default';

                // Increment the Correct Placements Counter
                levelSection.dataset.correctPlacements = parseInt(levelSection.dataset.correctPlacements || '0') + 1;

                console.log(`Item "${item.id}" is pre-placed in bin ${correctBinNumber}.`);

                // Disable Further Dragging
                disableItemDragging(item);
            }

            // Add Mousedown Event to Start Dragging Only if Not Placed
            if (!item.classList.contains('placed')) {
                item.addEventListener('mousedown', handleMouseDown);
            }
        });

        // Start the Timer for the Current Level
        startTimer();
    }

    // Function to Check if an Item is Inside Its Correct Bin
    function isItemInCorrectBin(item, binEntry) {
        const itemRect = item.getBoundingClientRect();
        const binRect = binEntry.actualBin.getBoundingClientRect();
        return isOverlapping(itemRect, binRect);
    }

    // Function to Disable Dragging for a Placed Item
    function disableItemDragging(item) {
        item.removeEventListener('mousedown', handleMouseDown);
        // Alternatively, you can add a transparent overlay or set pointer-events to none
    }

    // Function to Handle Game Completion
    function gameCompleted() {
        const currentLevel = levels[currentLevelIndex];
        const levelNumber = currentLevelIndex + 1;
        const completedMessage = completedSection.querySelector('div');
        const levelSpan = completedSection.querySelector('.level-span');
        const secondsSpan = completedSection.querySelector('.seconds-span');

        // Remove Grayscale from All Items
        currentLevel.querySelectorAll(".grayed-out").forEach(gr => {
            gr.classList.add("not-gray");
        });

        // Clear the Timer as the Game is Completed
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Calculate time taken
        const timeTaken = parseInt(currentLevel.querySelector('.actual-timer').textContent.split(':')[1]);

        // Update the completed message with dynamic content
        levelSpan.textContent = `${levelNumber}${getOrdinalSuffix(levelNumber)} level`;
        secondsSpan.textContent = `${timeTaken+15}`;

        // Pause for 2 seconds before showing the completed message
        setTimeout(() => {
            // Show the "#completed" section
            hideAllSections();
            showSection(completedSection);

            // Pause for 2 seconds before moving to the next level or finishing the game
            setTimeout(() => {
                hideAllSections();

                if (currentLevelIndex < levels.length - 1) {
                    // Move to the Next Level
                    currentLevelIndex++;
                    const nextLevel = levels[currentLevelIndex];
                    initializeLevel(nextLevel); // Initialize Next Level
                } else {
                    // All Levels Completed
                    // Optionally, show a final message or reset the game
                    setTimeout(() => {
                        hideAllSections();
                        showSection(startSection);
                        resetGame();
                    }, 2000); // 2 seconds
                }
            }, 2000); // 2 seconds for completed message
        }, 2000); // 2 seconds pause after removing grayscale
    }

    // Helper Function to Get Ordinal Suffix for Numbers (e.g., 1st, 2nd)
    function getOrdinalSuffix(n) {
        const s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Function to Reset the Game
    function resetGame() {
        // Clear Timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Reset All Levels
        levels.forEach((level, index) => {
            const items = level.querySelectorAll('.items .item, .actual-bin .item');
            const binContainers = level.querySelectorAll('.bins .bin-container');

            // Reset Items
            items.forEach(item => {
                // Reset Position to Original
                item.style.left = item.dataset.originalLeft;
                item.style.top = item.dataset.originalTop;

                // Remove 'placed' Class and Reset Cursor
                item.classList.remove('placed');
                item.style.cursor = 'grab';

                // Reset Any Transformations or z-index
                item.style.transform = '';
                item.style.zIndex = '';

                // Re-attach the mousedown event listener if necessary
                item.addEventListener('mousedown', handleMouseDown);
            });

            // Reset Bin Visuals
            binContainers.forEach(bin => {
                bin.querySelector('.actual-bin').classList.remove('shake');
            });

            // Hide All Levels
            level.style.display = 'none';
        });

        // Reset Completed Section
        if (completedSection) {
            completedSection.style.display = 'none';
            completedSection.querySelector('div').textContent = ''; // Clear Any Messages
        }

        // Reset Game Over Section
        if (gameOverSection) {
            gameOverSection.style.display = 'none';
        }

        // Reset Current Level Index
        currentLevelIndex = 0;

        // Show Start Section
        hideAllSections();
        showSection(startSection);

        console.log('Game has been reset.');
    }

    // ----------------------------
    // Event Listeners for Navigation
    // ----------------------------

    // Function to Start the Game (Initialize the First Level)
    function startGame() {
        hideAllSections();
        if (levels.length > 0) {
            initializeLevel(levels[currentLevelIndex]);
        } else {
            console.error('No levels found in the HTML.');
        }
    }

    // Function to Show How to Play
    function showHowToPlay() {
        hideAllSections();
        showSection(howSection);
    }

    // Function to Show Start Section from How Section
    function backToStart() {
        hideAllSections();
        showSection(startSection);
    }

    // Add Click Event Listeners to "Start Game" Buttons
    startButtons.forEach(button => {
        button.addEventListener('click', startGame);
    });

    // Add Click Event Listeners to "How to Play" Buttons
    howButtons.forEach(button => {
        button.addEventListener('click', showHowToPlay);
    });

    // Add Click Event Listeners to "Back" Buttons in How Section
    backButtons.forEach(button => {
        button.addEventListener('click', backToStart);
    });

    // Add Click Event Listener to Reset Button
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }

    // ----------------------------
    // Initial Setup: Show Start Section
    // ----------------------------
    hideAllSections();
    showSection(startSection);
});
