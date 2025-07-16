// Sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);

// Game state
const gameState = {
    currentScreen: 'loading',
    user: {
        name: '',
        avatar: 1,
        cognitiveProfile: '',
        level: 1,
        xp: 0,
        streakDays: 0,
        badges: [],
        highScores: [],
        lastDailyChallenge: null,
        lastStreakUpdate: null
    },
    settings: {
        sound: true,
        music: true,
        difficulty: 'adaptive', // easy, medium, hard, adaptive
        theme: 'dark'
    },
    currentQuiz: {
        questions: [],
        currentQuestionIndex: 0,
        timeRemaining: 0,
        score: 0,
        correctAnswers: 0,
        startTime: 0,
        isDailyChallenge: false
    },
    dailyChallenge: {
        available: true,
        completed: false,
        expiresAt: null
    }
};

// Screen components
const screens = {
    loading: document.getElementById('loading-screen'),
    main: document.getElementById('main-container')
};

// Initialize loading sequence
document.addEventListener('DOMContentLoaded', () => {
    initializeLoadingSequence();
    
    // Check if daily challenge is available
    checkDailyChallenge();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Add meta viewport tag for proper mobile scaling if not already present
    if (!document.querySelector('meta[name="viewport"]')) {
        const metaTag = document.createElement('meta');
        metaTag.name = 'viewport';
        metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(metaTag);
    }
    
    // Add apple-mobile-web-app-capable meta tag for iOS fullscreen
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const metaTag = document.createElement('meta');
        metaTag.name = 'apple-mobile-web-app-capable';
        metaTag.content = 'yes';
        document.head.appendChild(metaTag);
    }
    
    // Prevent double-tap zoom on iOS
    document.addEventListener('touchend', function(event) {
        event.preventDefault();
        // Process the touchend event only if it's a simple tap
        if (event.changedTouches && event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target) {
                // Simulate a click event
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                target.dispatchEvent(clickEvent);
            }
        }
    }, { passive: false });
    
    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
});

// Check if daily challenge is available
function checkDailyChallenge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    // If last daily challenge was completed today, mark as completed
    if (gameState.user.lastDailyChallenge) {
        const lastChallengeDate = new Date(gameState.user.lastDailyChallenge);
        lastChallengeDate.setHours(0, 0, 0, 0);
        
        if (lastChallengeDate.getTime() === today.getTime()) {
            gameState.dailyChallenge.available = true;
            gameState.dailyChallenge.completed = true;
            return;
        }
    }
    
    // Set expiry time to end of today
    const expiryDate = new Date(today);
    expiryDate.setHours(23, 59, 59, 999);
    
    gameState.dailyChallenge = {
        available: true,
        completed: false,
        expiresAt: expiryDate.getTime()
    };
}

// Start daily challenge
function startDailyChallenge() {
    // Create a special quiz with mixed question types
    const questions = [];
    
    // Add 3 quick challenge questions
    const quickQuestions = generateQuestions('quick').slice(0, 3);
    questions.push(...quickQuestions);
    
    // Add 2 memory challenges
    const memoryQuestions = generateQuestions('memory').slice(0, 2);
    questions.push(...memoryQuestions);
    
    // Shuffle the questions
    questions.sort(() => Math.random() - 0.5);
    
    // Set up the quiz
    gameState.currentQuiz = {
        mode: 'daily',
        questions: questions,
        currentQuestionIndex: 0,
        timeRemaining: 0,
        score: 0,
        correctAnswers: 0,
        startTime: Date.now(),
        isDailyChallenge: true
    };
    
    navigateTo('quiz');
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Only process keyboard shortcuts on non-mobile devices
    if (isMobile) return;
    
    // Space to start/continue
    if (e.code === 'Space' && (gameState.currentScreen === 'welcome' || gameState.currentScreen === 'result')) {
        e.preventDefault();
        if (gameState.currentScreen === 'welcome') {
            navigateTo('profile');
        } else if (gameState.currentScreen === 'result') {
            navigateTo('home');
        }
    }
    
    // Number keys 1-4 for quiz answers
    if (gameState.currentScreen === 'quiz' && e.key >= '1' && e.key <= '4') {
        const answerIndex = parseInt(e.key) - 1;
        const answerButtons = document.querySelectorAll('.answer-option');
        if (answerButtons[answerIndex]) {
            answerButtons[answerIndex].click();
        }
    }
    
    // Escape to pause
    if (e.code === 'Escape' && gameState.currentScreen === 'quiz') {
        togglePause();
    }
}

// Initialize loading sequence
function initializeLoadingSequence() {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    const loadingTexts = [
        'Initializing neural interface...',
        'Calibrating cognitive sensors...',
        'Loading question database...',
        'Optimizing neural pathways...',
        'Establishing synaptic connections...'
    ];
    
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 5;
        loadingBar.style.width = `${progress}%`;
        
        if (progress % 20 === 0) {
            const textIndex = Math.floor(progress / 20) - 1;
            if (textIndex < loadingTexts.length) {
                loadingText.textContent = loadingTexts[textIndex];
                playSound('blip');
            }
        }
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                navigateTo('welcome');
            }, 500);
        }
    }, 120);
}

// Navigation function
function navigateTo(screen) {
    // Hide all screens
    screens.loading.classList.add('hidden');
    screens.main.classList.add('hidden');
    
    // Update game state
    gameState.currentScreen = screen;
    
    // Show appropriate screen
    if (screen === 'loading') {
        screens.loading.classList.remove('hidden');
    } else {
        screens.main.classList.remove('hidden');
        renderScreen(screen);
    }
    
    // Play transition sound
    playSound('transition');
}

// Render screen content
function renderScreen(screen) {
    // Clear main container
    screens.main.innerHTML = '';
    
    // Render appropriate screen
    switch(screen) {
        case 'welcome':
            renderWelcomeScreen();
            break;
        case 'profile':
            renderProfileScreen();
            break;
        case 'home':
            renderHomeScreen();
            break;
        case 'quiz':
            renderQuizScreen();
            break;
        case 'result':
            renderResultScreen();
            break;
        case 'leaderboard':
            renderLeaderboardScreen();
            break;
        default:
            renderWelcomeScreen();
    }
}

// Sound effects
function playSound(type) {
    if (!gameState.settings.sound) return;
    
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'correct':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'wrong':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'blip':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'transition':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// Welcome Screen
function renderWelcomeScreen() {
    const welcomeScreen = document.createElement('div');
    welcomeScreen.className = 'h-full w-full flex flex-col items-center justify-center neural-bg cyber-grid';
    welcomeScreen.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        <div class="relative z-10 flex flex-col items-center">
            <div class="mb-8 text-center">
                <h1 class="text-6xl font-orbitron font-bold mb-2">
                    <span class="text-blue-400 neon-text">BRAIN</span><span class="text-purple-400 neon-purple">QUEST</span>
                </h1>
                <p class="text-gray-300 text-xl tracking-wide">COGNITIVE ENHANCEMENT SYSTEM</p>
            </div>
            
            <div class="neural-card p-8 max-w-lg text-center mb-8">
                <p class="text-gray-300 mb-6">Welcome to the next generation of cognitive training. BrainQuest adapts to your unique neural patterns to optimize mental performance.</p>
                <p class="text-blue-400 mb-4">Are you ready to enhance your mind?</p>
            </div>
            
            <button id="start-btn" class="cyber-button text-lg px-8 py-3">
                INITIALIZE SEQUENCE
            </button>
            
            ${!isMobile ? `<p class="text-gray-500 mt-6 text-sm">PRESS SPACE TO CONTINUE</p>` : ''}
        </div>
    `;
    
    screens.main.appendChild(welcomeScreen);
    
    // Event listeners
    document.getElementById('start-btn').addEventListener('click', () => {
        navigateTo('profile');
    });
}

// Helper function for avatar gradients
function getAvatarGradient(id) {
    const gradients = [
        'from-blue-500 to-purple-600',
        'from-green-500 to-teal-600',
        'from-red-500 to-orange-600',
        'from-purple-500 to-pink-600'
    ];
    return gradients[id - 1] || gradients[0];
}

// Helper function for avatar border colors
function getAvatarBorderColor(id) {
    // Colors for selected avatars (darker/vibrant)
    const selectedColors = [
        'border-blue-500 text-blue-400 blue-selected',
        'border-green-500 text-green-400 green-selected',
        'border-red-500 text-red-400 red-selected',
        'border-purple-500 text-purple-400 purple-selected'
    ];
    
    // Colors for unselected avatars (lighter)
    const unselectedColors = [
        'border-blue-300 border-opacity-40',
        'border-green-300 border-opacity-40',
        'border-red-300 border-opacity-40',
        'border-purple-300 border-opacity-40'
    ];
    
    return {
        selected: selectedColors[id - 1] || selectedColors[0],
        unselected: unselectedColors[id - 1] || unselectedColors[0]
    };
}

// Helper function to generate random names
function generateRandomName() {
    const prefixes = [
        "Neo", "Cyber", "Synth", "Quantum", "Flux", "Echo", "Pulse", "Vector", 
        "Nova", "Apex", "Helix", "Orbit", "Zenith", "Nexus", "Cipher", "Cortex"
    ];
    
    const suffixes = [
        "Mind", "Wave", "Byte", "Core", "Node", "Link", "Path", "Spark", 
        "Grid", "Void", "Sync", "Flux", "Tech", "Naut", "Ware", "Net"
    ];
    
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Add a random number occasionally
    const addNumber = Math.random() > 0.5;
    const randomNum = addNumber ? Math.floor(Math.random() * 100) : "";
    
    return `${randomPrefix}${randomSuffix}${randomNum}`;
}

// Profile Creation Screen
function renderProfileScreen() {
    const profileScreen = document.createElement('div');
    profileScreen.className = 'h-full w-full flex flex-col items-center justify-center neural-bg overflow-y-auto py-10';
    profileScreen.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        <div class="relative z-10 w-full max-w-2xl px-4">
            <h2 class="text-3xl font-orbitron text-blue-400 neon-text text-center mb-8">NEURAL PROFILE CREATION</h2>
            
            <div class="neural-card p-6 md:p-8">
                <form id="profile-form" class="space-y-6">
                    <div class="mb-6">
                        <label class="block text-gray-300 mb-2">Subject Identifier</label>
                        <div class="relative">
                            <input type="text" id="username" class="w-full bg-gray-900 border border-blue-500 text-white p-3 pr-12 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter identifier">
                            <button type="button" id="random-name-btn" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors" title="Generate random name">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.444 7.257a.5.5 0 00-.513-.086l-2.649 1.232a.5.5 0 01-.656-.228l-.659-1.431a.5.5 0 00-.921 0L13.38 8.17a.5.5 0 01-.656.228l-2.648-1.232a.5.5 0 00-.513.086l-1.05 1.05a.5.5 0 00-.086.513l1.232 2.648a.5.5 0 01-.228.656l-1.431.659a.5.5 0 000 .921l1.431.659a.5.5 0 01.228.656l-1.232 2.648a.5.5 0 00.086.513l1.05 1.05a.5.5 0 00.513.086l2.648-1.232a.5.5 0 01.656.228l.659 1.431a.5.5 0 00.921 0l.659-1.431a.5.5 0 01.656-.228l2.648 1.232a.5.5 0 00.513-.086l1.05-1.05a.5.5 0 00.086-.513l-1.232-2.648a.5.5 0 01.228-.656l1.431-.659a.5.5 0 000-.921l-1.431-.659a.5.5 0 01-.228-.656l1.232-2.648a.5.5 0 00-.086-.513l-1.05-1.05z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-gray-300 mb-4">Select Neural Avatar</label>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${[1, 2, 3, 4].map(id => {
                                const avatarColors = getAvatarBorderColor(id);
                                const borderClass = id === 1 
                                    ? avatarColors.selected.split(' ')[0] 
                                    : avatarColors.unselected;
                                const textColorClass = id === 1 
                                    ? avatarColors.selected.split(' ')[1] 
                                    : 'text-gray-500';
                                const selectedClass = id === 1 
                                    ? 'selected ' + avatarColors.selected.split(' ')[2]
                                    : '';
                                return `
                                    <div class="avatar-option cursor-pointer" data-avatar="${id}">
                                        <div class="avatar-frame h-16 md:h-20 w-16 md:w-20 mx-auto flex items-center justify-center border-2 ${borderClass} ${selectedClass}">
                                            <div class="h-12 md:h-16 w-12 md:w-16 rounded-full bg-gradient-to-br ${getAvatarGradient(id)}"></div>
                                        </div>
                                        <p class="text-center mt-2 text-xs ${textColorClass}">Avatar ${id}</p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-gray-300 mb-2">Cognitive Profile</label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="cognitive-profile-option cursor-pointer p-4 border border-gray-700 rounded hover:border-blue-500" data-profile="analyzer">
                                <h3 class="text-blue-400">Analyzer</h3>
                                <p class="text-gray-400 text-sm">Logical reasoning & pattern recognition</p>
                            </div>
                            <div class="cognitive-profile-option cursor-pointer p-4 border border-gray-700 rounded hover:border-blue-500" data-profile="visualizer">
                                <h3 class="text-purple-400">Visualizer</h3>
                                <p class="text-gray-400 text-sm">Spatial reasoning & creative solutions</p>
                            </div>
                            <div class="cognitive-profile-option cursor-pointer p-4 border border-gray-700 rounded hover:border-blue-500" data-profile="memorizer">
                                <h3 class="text-green-400">Memorizer</h3>
                                <p class="text-gray-400 text-sm">Information retention & recall</p>
                            </div>
                            <div class="cognitive-profile-option cursor-pointer p-4 border border-gray-700 rounded hover:border-blue-500" data-profile="accelerator">
                                <h3 class="text-red-400">Accelerator</h3>
                                <p class="text-gray-400 text-sm">Speed processing & quick decisions</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-center">
                        <button type="submit" class="cyber-button text-lg px-8 py-3">
                            INITIALIZE PROFILE
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    screens.main.appendChild(profileScreen);
    
    // Event listeners
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', () => {
            // Get selected avatar ID
            const avatarId = parseInt(option.dataset.avatar);
            const avatarColors = getAvatarBorderColor(avatarId);
            const borderColorClass = avatarColors.selected.split(' ')[0];
            const textColorClass = avatarColors.selected.split(' ')[1];
            const selectedClass = avatarColors.selected.split(' ')[2];
            
            // Update all avatars to unselected state first
            document.querySelectorAll('.avatar-option').forEach(opt => {
                const id = parseInt(opt.dataset.avatar);
                const unselectedBorder = getAvatarBorderColor(id).unselected;
                const frame = opt.querySelector('.avatar-frame');
                
                // Remove all possible border classes
                frame.classList.remove(
                    'border-blue-500', 'border-green-500', 'border-red-500', 'border-purple-500',
                    'border-blue-300', 'border-green-300', 'border-red-300', 'border-purple-300',
                    'border-opacity-40', 'selected', 
                    'blue-selected', 'green-selected', 'red-selected', 'purple-selected'
                );
                
                // Add unselected border
                unselectedBorder.split(' ').forEach(cls => {
                    frame.classList.add(cls);
                });
                
                // Update text color
                const text = opt.querySelector('p');
                text.classList.remove('text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400');
                text.classList.add('text-gray-500');
            });
            
            // Add highlight to selected avatar with its specific color
            const frame = option.querySelector('.avatar-frame');
            frame.classList.remove('border-opacity-40');
            frame.classList.add(borderColorClass, 'selected', selectedClass);
            
            const text = option.querySelector('p');
            text.classList.remove('text-gray-500');
            text.classList.add(textColorClass);
            
            // Add a visual feedback animation
            frame.classList.add('scale-in');
            setTimeout(() => {
                frame.classList.remove('scale-in');
            }, 500);
            
            gameState.user.avatar = avatarId;
            playSound('blip');
        });
    });
    
    document.querySelectorAll('.cognitive-profile-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.cognitive-profile-option').forEach(opt => {
                opt.classList.remove('border-blue-500', 'bg-gray-900');
                opt.classList.add('border-gray-700');
            });
            option.classList.remove('border-gray-700');
            option.classList.add('border-blue-500', 'bg-gray-900');
            gameState.user.cognitiveProfile = option.dataset.profile;
            playSound('blip');
        });
    });
    
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        if (username) {
            gameState.user.name = username;
            navigateTo('home');
        } else {
            // Show error
            document.getElementById('username').classList.add('border-red-500');
            setTimeout(() => {
                document.getElementById('username').classList.remove('border-red-500');
            }, 2000);
        }
    });

    // Random name generator event listener
    document.getElementById('random-name-btn').addEventListener('click', () => {
        const usernameInput = document.getElementById('username');
        usernameInput.value = generateRandomName();
        usernameInput.classList.add('pulse');
        playSound('blip');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            usernameInput.classList.remove('pulse');
        }, 1000);
    });
}

// Home Screen
function renderHomeScreen() {
    const homeScreen = document.createElement('div');
    homeScreen.className = 'h-full w-full neural-bg home-screen-container';
    
    homeScreen.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        
        <!-- Header with user info -->
        <header class="relative z-10 p-3 md:p-4 flex justify-between items-center">
            <div class="flex items-center user-profile-container">
                <div class="avatar-frame h-10 w-10 md:h-12 md:w-12 flex items-center justify-center mr-2 md:mr-3">
                    <div class="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(gameState.user.avatar)}"></div>
                </div>
                <div>
                    <h3 class="font-orbitron text-blue-400 text-sm md:text-base">${gameState.user.name}</h3>
                    <div class="flex items-center text-xs text-gray-400">
                        <span class="level-indicator">LVL ${gameState.user.level}</span>
                        <div class="mx-2 w-16 md:w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div class="h-full bg-blue-500" style="width: ${(gameState.user.xp % 100)}%;"></div>
                        </div>
                        <span>${gameState.user.xp}/100 XP</span>
                    </div>
                </div>
            </div>
            
            <div class="flex">
                <button id="settings-btn" class="mr-2 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors hover:scale-110 transform duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <button id="leaderboard-btn" class="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors hover:scale-110 transform duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </button>
            </div>
        </header>
        
        <!-- Main content -->
        <main class="relative z-10 px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-8">
            <!-- Daily streak -->
            <div class="neural-card p-3 md:p-4 streak-card">
                <div class="flex justify-between items-center">
                    <h3 class="font-orbitron text-blue-400 flex items-center text-sm md:text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
                        </svg>
                        Neural Streak
                    </h3>
                    <span class="text-purple-400 font-bold streak-days text-sm md:text-base">${gameState.user.streakDays} DAYS</span>
                </div>
                <p class="text-gray-400 text-xs md:text-sm mt-1">Complete daily challenges to maintain your neural pathway optimization</p>
                <div class="mt-2 md:mt-3 flex justify-between">
                    ${Array(7).fill(0).map((_, i) => `
                        <div class="flex flex-col items-center streak-day ${i < gameState.user.streakDays % 7 ? 'active' : ''}">
                            <div class="h-6 w-6 md:h-8 md:w-8 rounded-full ${i < gameState.user.streakDays % 7 ? 'bg-blue-500' : 'bg-gray-800'} flex items-center justify-center text-xs">
                                ${i + 1}
                            </div>
                            <span class="text-xs text-gray-500 mt-1">Day</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Daily Challenge -->
            <div class="neural-card p-3 md:p-4 border ${gameState.dailyChallenge.available ? 'border-yellow-500' : 'border-gray-700'} relative overflow-hidden daily-challenge-card">
                <div class="absolute top-0 right-0 w-24 h-24 ${gameState.dailyChallenge.completed ? 'bg-green-500' : 'bg-yellow-500'} rotate-45 translate-x-12 -translate-y-12 opacity-20"></div>
                <div class="flex justify-between items-center">
                    <h3 class="font-orbitron text-yellow-400 flex items-center text-sm md:text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                        </svg>
                        Daily Challenge
                    </h3>
                    ${gameState.dailyChallenge.completed ? 
                        `<span class="badge bg-green-500 text-xs px-2 py-1 rounded-full pulse-animation">COMPLETED</span>` : 
                        `<span class="badge bg-yellow-500 text-xs px-2 py-1 rounded-full pulse-animation">NEW</span>`
                    }
                </div>
                <p class="text-gray-400 text-xs md:text-sm mt-2">Special daily brain training with bonus XP rewards</p>
                <div class="mt-3 md:mt-4 flex justify-between items-center">
                    <div>
                        <span class="text-xs md:text-sm text-yellow-300">Reward: </span>
                        <span class="text-white font-bold text-xs md:text-sm">+50 XP</span>
                    </div>
                    <button id="daily-challenge-btn" class="cyber-button px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm ${gameState.dailyChallenge.completed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transform transition-transform'} daily-challenge-btn">
                        ${gameState.dailyChallenge.completed ? 'COMPLETED' : 'START CHALLENGE'}
                    </button>
                </div>
            </div>
            
            <!-- Challenge modes -->
            <div>
                <h2 class="font-orbitron text-lg md:text-xl text-white mb-3 md:mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                    </svg>
                    Challenge Modes
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-8">
                    <!-- Quick Challenge -->
                    <div class="neural-card p-3 md:p-5 cursor-pointer hover:transform hover:scale-[1.02] transition-transform challenge-card" id="quick-challenge">
                        <div class="flex items-center mb-2 md:mb-3">
                            <div class="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 md:mr-3 challenge-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 class="font-orbitron text-blue-400 text-sm md:text-base">Quick Challenge</h3>
                        </div>
                        <p class="text-gray-400 text-xs md:text-sm">5 questions • 30 seconds each • Adaptive difficulty</p>
                        <div class="mt-2 md:mt-3 flex justify-between items-center">
                            <div class="flex items-center text-xs text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                2-3 min
                            </div>
                            <span class="text-xs px-2 py-1 rounded-full bg-blue-900 bg-opacity-50 text-blue-300">
                                +100 XP
                            </span>
                        </div>
                    </div>
                    
                    <!-- Memory Matrix -->
                    <div class="neural-card p-3 md:p-5 cursor-pointer hover:transform hover:scale-[1.02] transition-transform challenge-card" id="memory-matrix">
                        <div class="flex items-center mb-2 md:mb-3">
                            <div class="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 md:mr-3 challenge-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                            <h3 class="font-orbitron text-purple-400 text-sm md:text-base">Memory Matrix</h3>
                        </div>
                        <p class="text-gray-400 text-xs md:text-sm">Visual pattern recognition • Sequence memorization</p>
                        <div class="mt-2 md:mt-3 flex justify-between items-center">
                            <div class="flex items-center text-xs text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                4-5 min
                            </div>
                            <span class="text-xs px-2 py-1 rounded-full bg-purple-900 bg-opacity-50 text-purple-300">
                                +150 XP
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Achievements -->
            <div class="mb-4 md:mb-8">
                <div class="flex justify-between items-center mb-3 md:mb-4">
                    <h2 class="font-orbitron text-lg md:text-xl text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        Neural Achievements
                    </h2>
                    <button class="text-xs md:text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
                </div>
                <div class="neural-card p-3 md:p-4">
                    <div class="grid grid-cols-4 gap-2 md:gap-4 achievements-grid">
                        ${Array(4).fill(0).map((_, i) => {
                            const unlocked = i < 2;
                            return `
                                <div class="flex flex-col items-center achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                                    <div class="h-12 w-12 md:h-16 md:w-16 rounded-full ${unlocked ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gray-800'} flex items-center justify-center mb-1 md:mb-2 achievement-icon">
                                        ${unlocked ? `
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ` : `
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 md:h-8 md:w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        `}
                                    </div>
                                    <span class="text-xs text-center ${unlocked ? 'text-blue-400' : 'text-gray-500'}">${unlocked ? 'First Quiz' : 'Locked'}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div>
                <h2 class="font-orbitron text-lg md:text-xl text-white mb-3 md:mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                    Recent Activity
                </h2>
                <div class="neural-card p-3 md:p-4">
                    ${gameState.user.highScores.length > 0 ? `
                        <div class="space-y-2 md:space-y-3 activity-list">
                            ${gameState.user.highScores.map((score, index) => `
                                <div class="flex justify-between items-center p-2 border-b border-gray-800 activity-item" style="animation-delay: ${index * 0.1}s">
                                    <div>
                                        <h4 class="text-blue-400 text-xs md:text-sm">${score.mode}</h4>
                                        <p class="text-xs text-gray-400">${new Date(score.date).toLocaleDateString()}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-green-400 font-bold text-xs md:text-sm">${score.score} pts</span>
                                        <p class="text-xs text-gray-400">${score.accuracy}% accuracy</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-4 md:py-6 empty-state">
                            <div class="mb-3 md:mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 md:h-12 md:w-12 text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <p class="text-gray-400 text-xs md:text-sm">No recent activity</p>
                            <p class="text-blue-400 text-xs mt-1 md:mt-2">Complete your first challenge to see results</p>
                        </div>
                    `}
                </div>
            </div>
        </main>
    `;
    
    screens.main.appendChild(homeScreen);
    
    // Add animations with setTimeout to trigger after render
    setTimeout(() => {
        // Animate streak days
        const streakDays = document.querySelectorAll('.streak-day');
        streakDays.forEach((day, index) => {
            if (day.classList.contains('active')) {
                setTimeout(() => {
                    day.classList.add('pop-in');
                }, index * 100);
            }
        });
        
        // Animate challenge cards
        const challengeCards = document.querySelectorAll('.challenge-card');
        challengeCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 300 + (index * 150));
        });
        
        // Animate achievement items
        const achievementItems = document.querySelectorAll('.achievement-item');
        achievementItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('fade-in');
            }, 600 + (index * 100));
        });
        
        // Animate activity items
        const activityItems = document.querySelectorAll('.activity-item');
        activityItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-10px)';
            
            setTimeout(() => {
                item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 800 + (index * 100));
        });
    }, 100);
    
    // Event listeners
    document.getElementById('quick-challenge').addEventListener('click', () => {
        startQuiz('quick');
    });
    
    document.getElementById('memory-matrix').addEventListener('click', () => {
        startQuiz('memory');
    });
    
    document.getElementById('daily-challenge-btn')?.addEventListener('click', () => {
        if (!gameState.dailyChallenge.completed) {
            startDailyChallenge();
        }
    });
    
    document.getElementById('leaderboard-btn').addEventListener('click', () => {
        navigateTo('leaderboard');
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        showSettings();
    });
}

// Helper function to show settings modal
function showSettings() {
    // Create settings modal
    const settingsModal = document.createElement('div');
    settingsModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4';
    settingsModal.innerHTML = `
        <div class="neural-card p-4 md:p-6 w-full max-w-md">
            <div class="flex justify-between items-center mb-4 md:mb-6">
                <h3 class="font-orbitron text-lg md:text-xl text-blue-400">Neural Interface Settings</h3>
                <button id="close-settings" class="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="space-y-3 md:space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-gray-300 text-sm md:text-base">Sound Effects</span>
                    <label class="switch">
                        <input type="checkbox" id="sound-toggle" ${gameState.settings.sound ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-gray-300 text-sm md:text-base">Background Music</span>
                    <label class="switch">
                        <input type="checkbox" id="music-toggle" ${gameState.settings.music ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div>
                    <span class="text-gray-300 block mb-2 text-sm md:text-base">Difficulty</span>
                    <div class="grid grid-cols-4 gap-1 md:gap-2">
                        <button class="difficulty-btn text-xs md:text-sm p-1 md:p-2 rounded ${gameState.settings.difficulty === 'easy' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}" data-difficulty="easy">Easy</button>
                        <button class="difficulty-btn text-xs md:text-sm p-1 md:p-2 rounded ${gameState.settings.difficulty === 'medium' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}" data-difficulty="medium">Medium</button>
                        <button class="difficulty-btn text-xs md:text-sm p-1 md:p-2 rounded ${gameState.settings.difficulty === 'hard' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}" data-difficulty="hard">Hard</button>
                        <button class="difficulty-btn text-xs md:text-sm p-1 md:p-2 rounded ${gameState.settings.difficulty === 'adaptive' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}" data-difficulty="adaptive">Adaptive</button>
                    </div>
                </div>
                
                <div class="pt-3 md:pt-4 border-t border-gray-800">
                    <button id="reset-progress" class="text-red-400 text-xs md:text-sm hover:text-red-300">Reset Neural Progress</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(settingsModal);
    
    // Event listeners
    document.getElementById('close-settings').addEventListener('click', () => {
        document.body.removeChild(settingsModal);
    });
    
    document.getElementById('sound-toggle').addEventListener('change', (e) => {
        gameState.settings.sound = e.target.checked;
        playSound('blip');
    });
    
    document.getElementById('music-toggle').addEventListener('change', (e) => {
        gameState.settings.music = e.target.checked;
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.settings.difficulty = btn.dataset.difficulty;
            document.querySelectorAll('.difficulty-btn').forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white');
                b.classList.add('bg-gray-800', 'text-gray-400');
            });
            btn.classList.remove('bg-gray-800', 'text-gray-400');
            btn.classList.add('bg-blue-600', 'text-white');
            playSound('blip');
        });
    });
    
    document.getElementById('reset-progress').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all neural progress? This cannot be undone.')) {
            gameState.user.level = 1;
            gameState.user.xp = 0;
            gameState.user.streakDays = 0;
            gameState.user.badges = [];
            gameState.user.highScores = [];
            document.body.removeChild(settingsModal);
            navigateTo('home');
        }
    });
}

// Start quiz function
function startQuiz(mode) {
    // Only allow quick and memory modes
    if (mode !== 'quick' && mode !== 'memory') {
        mode = 'quick'; // Default to quick challenge if invalid mode
    }
    
    // Reset quiz state
    gameState.currentQuiz = {
        mode: mode,
        questions: generateQuestions(mode),
        currentQuestionIndex: 0,
        timeRemaining: 0,
        score: 0,
        correctAnswers: 0,
        startTime: Date.now()
    };
    
    navigateTo('quiz');
}

// Generate questions based on quiz mode
function generateQuestions(mode) {
    const questions = [];
    let count = mode === 'quick' ? 5 : 10;
    
    // Sample questions for quick mode
    if (mode === 'quick') {
        const sampleQuestions = [
            {
                question: "Which number comes next in the sequence: 2, 4, 8, 16, __?",
                options: ["24", "28", "32", "64"],
                correctAnswer: 3,
                timeLimit: 20
            },
            {
                question: "If a = 1, b = 2, c = 3... what is the value of 'code'?",
                options: ["27", "28", "29", "30"],
                correctAnswer: 1,
                timeLimit: 25
            },
            {
                question: "What is the missing element? H, He, Li, __, B",
                options: ["F", "Be", "N", "O"],
                correctAnswer: 1,
                timeLimit: 20
            },
            {
                question: "Which shape would complete the pattern?",
                options: ["Circle", "Triangle", "Square", "Hexagon"],
                correctAnswer: 2,
                timeLimit: 30,
                imageUrl: "https://via.placeholder.com/300x200?text=Pattern+Puzzle"
            },
            {
                question: "If 5 + 3 = 28, 9 + 1 = 810, then 7 + 2 = ?",
                options: ["59", "514", "95", "149"],
                correctAnswer: 0,
                timeLimit: 30
            },
            {
                question: "Which word is the odd one out?",
                options: ["Swift", "Python", "Cobra", "Viper"],
                correctAnswer: 1,
                timeLimit: 15
            },
            {
                question: "Complete the analogy: Book is to Reading as Fork is to...",
                options: ["Kitchen", "Eating", "Cooking", "Utensil"],
                correctAnswer: 1,
                timeLimit: 20
            }
        ];
        
        // Randomly select questions
        const selectedIndices = new Set();
        while (selectedIndices.size < count) {
            const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
            selectedIndices.add(randomIndex);
        }
        
        // Add selected questions
        Array.from(selectedIndices).forEach(index => {
            questions.push(sampleQuestions[index]);
        });
    }
    // Memory Matrix mode
    else if (mode === 'memory') {
        // Generate memory matrix challenges
        for (let i = 0; i < count; i++) {
            // Increase difficulty as the game progresses
            const gridSize = Math.min(4 + Math.floor(i / 3), 6); // Start at 4x4, max 6x6
            const numCells = Math.min(3 + Math.floor(i / 2), 8); // Start with 3 cells, max 8
            
            questions.push({
                type: 'memory',
                gridSize: gridSize,
                numCells: numCells,
                timeLimit: 30,
                memorizeTime: 3000 + (i * 200), // Time to memorize pattern (in ms)
                difficulty: i + 1
            });
        }
    }
    
    return questions;
}

// Quiz Screen
function renderQuizScreen() {
    const quizScreen = document.createElement('div');
    quizScreen.className = 'h-full w-full neural-bg flex flex-col';
    
    // Get current question
    const currentQuestion = gameState.currentQuiz.questions[gameState.currentQuiz.currentQuestionIndex];
    const timeLimit = currentQuestion.timeLimit || 30;
    
    // Set time remaining
    gameState.currentQuiz.timeRemaining = timeLimit;
    
    // Check if this is a memory challenge
    if (currentQuestion.type === 'memory') {
        renderMemoryMatrixChallenge(quizScreen, currentQuestion);
    } else {
        // Standard quiz question
        quizScreen.innerHTML = `
            <div class="absolute inset-0 cyber-grid"></div>
            
            <!-- Quiz Header -->
            <header class="relative z-10 p-4 flex justify-between items-center">
                <div class="flex items-center">
                    <div class="mr-2 h-8 w-8 rounded-full bg-gradient-to-br ${getModeGradient(gameState.currentQuiz.mode)} flex items-center justify-center text-white font-bold">
                        ${gameState.currentQuiz.currentQuestionIndex + 1}
                    </div>
                    <span class="text-gray-300">of ${gameState.currentQuiz.questions.length}</span>
                </div>
                
                <div class="flex items-center">
                    <button id="pause-btn" class="mr-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <div class="text-right mr-4">
                        <div class="text-sm text-gray-400">Score</div>
                        <div class="text-blue-400 font-bold">${gameState.currentQuiz.score}</div>
                    </div>
                    <div id="timer" class="h-12 w-12 rounded-full border-2 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-400 transition-colors">
                        ${timeLimit}
                    </div>
                </div>
            </header>
            
            <!-- Question Content -->
            <div class="relative z-10 flex-grow flex flex-col items-center justify-center p-4 overflow-y-auto quiz-content">
                <div class="neural-card p-4 md:p-6 w-full max-w-3xl mx-auto mb-6">
                    <h2 class="text-lg md:text-xl lg:text-2xl text-white mb-4 md:mb-6">${currentQuestion.question}</h2>
                    
                    ${currentQuestion.imageUrl ? `
                        <div class="mb-4 md:mb-6 flex justify-center">
                            <img src="${currentQuestion.imageUrl}" alt="Question Visual" class="max-w-full h-auto rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105">
                        </div>
                    ` : ''}
                    
                    <div class="grid grid-cols-1 ${currentQuestion.options.length > 2 ? 'md:grid-cols-2' : ''} gap-3 md:gap-4">
                        ${currentQuestion.options.map((option, index) => `
                            <button class="answer-option neural-card p-3 md:p-4 text-left hover:border-blue-500 border border-transparent transition-all duration-300 transform hover:scale-[1.02] hover:shadow-glow" data-index="${index}">
                                <div class="flex items-center">
                                    <div class="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 md:mr-3 text-gray-300 answer-number text-sm md:text-base">
                                        ${index + 1}
                                    </div>
                                    <span class="text-sm md:text-base">${option}</span>
                                </div>
                                ${!isMobile ? `
                                <div class="absolute bottom-1 right-1 md:bottom-2 md:right-2 text-xs text-gray-500 opacity-70">
                                    Press ${index + 1} key
                                </div>
                                ` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Progress bar -->
            <div class="relative z-10 w-full h-2 bg-gray-800">
                <div id="progress-bar" class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style="width: ${(gameState.currentQuiz.currentQuestionIndex / gameState.currentQuiz.questions.length) * 100}%"></div>
            </div>
            
            <!-- Pause Menu (initially hidden) -->
            <div id="pause-menu" class="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center hidden">
                <div class="neural-card p-4 md:p-8 w-full max-w-md text-center m-4">
                    <h2 class="text-2xl md:text-3xl font-orbitron text-blue-400 mb-4 md:mb-6">PAUSED</h2>
                    
                    <div class="space-y-4 mb-6 md:mb-8">
                        <p class="text-gray-300">Neural challenge interrupted</p>
                    </div>
                    
                    <div class="flex flex-col space-y-3">
                        <button id="resume-btn" class="cyber-button py-2 md:py-3">
                            RESUME CHALLENGE
                        </button>
                        <button id="restart-btn" class="cyber-button py-2 md:py-3">
                            RESTART CHALLENGE
                        </button>
                        <button id="quit-btn" class="cyber-button py-2 md:py-3 bg-red-900 bg-opacity-30 hover:bg-opacity-50">
                            QUIT CHALLENGE
                        </button>
                    </div>
                    
                    ${!isMobile ? `<p class="text-gray-500 text-sm mt-4 md:mt-6">Press ESC to resume</p>` : ''}
                </div>
            </div>
        `;
        
        screens.main.appendChild(quizScreen);
        
        // Start timer
        startQuizTimer();
        
        // Add event listeners to answer options
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', () => {
                const selectedIndex = parseInt(option.dataset.index);
                handleAnswer(selectedIndex);
            });
            
            // Add touch feedback for mobile
            if (isMobile) {
                option.addEventListener('touchstart', () => {
                    option.classList.add('border-blue-500', 'bg-gray-800');
                });
                
                option.addEventListener('touchend', () => {
                    setTimeout(() => {
                        option.classList.remove('border-blue-500', 'bg-gray-800');
                    }, 150);
                });
            }
        });
    }
    
    // Add pause button event listener
    document.getElementById('pause-btn').addEventListener('click', () => {
        togglePause();
    });
    
    // Add pause menu button event listeners
    document.getElementById('resume-btn')?.addEventListener('click', () => {
        togglePause();
    });
    
    document.getElementById('restart-btn')?.addEventListener('click', () => {
        // Clear timer
        clearInterval(gameState.currentQuiz.timerInterval);
        // Restart the current quiz
        startQuiz(gameState.currentQuiz.mode);
    });
    
    document.getElementById('quit-btn')?.addEventListener('click', () => {
        // Clear timer
        clearInterval(gameState.currentQuiz.timerInterval);
        // Return to home screen
        navigateTo('home');
    });
}

// Memory Matrix Challenge
function renderMemoryMatrixChallenge(container, challenge) {
    const gridSize = challenge.gridSize;
    const numCells = challenge.numCells;
    const timeLimit = challenge.timeLimit;
    
    container.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        
        <!-- Quiz Header -->
        <header class="relative z-10 p-4 flex justify-between items-center">
            <div class="flex items-center">
                <div class="mr-2 h-8 w-8 rounded-full bg-gradient-to-br ${getModeGradient('memory')} flex items-center justify-center text-white font-bold">
                    ${gameState.currentQuiz.currentQuestionIndex + 1}
                </div>
                <span class="text-gray-300">of ${gameState.currentQuiz.questions.length}</span>
            </div>
            
            <div class="flex items-center">
                <button id="pause-btn" class="mr-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <div class="text-right mr-4">
                    <div class="text-sm text-gray-400">Score</div>
                    <div class="text-blue-400 font-bold">${gameState.currentQuiz.score}</div>
                </div>
                <div id="timer" class="h-12 w-12 rounded-full border-2 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-400 transition-colors">
                    ${timeLimit}
                </div>
            </div>
        </header>
        
        <!-- Memory Matrix Content -->
        <div class="relative z-10 flex-grow flex flex-col items-center p-2 md:p-4 overflow-y-auto quiz-content">
            <div class="neural-card p-3 md:p-6 w-full max-w-3xl mx-auto mb-4 md:mb-6">
                <div class="flex items-center mb-2 md:mb-4">
                    <div class="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 md:mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-4 md:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 class="text-lg md:text-xl lg:text-2xl text-white">
                        <span id="memory-instruction" class="text-purple-400 font-orbitron">Memorize the pattern</span>
                    </h2>
                </div>
                
                <div class="memory-container relative p-2 md:p-4">
                    <div class="memory-difficulty-indicator absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-purple-900 text-xs text-white px-2 py-1 rounded-full">
                        Level ${challenge.difficulty}
                    </div>
                    
                    <div class="memory-status-indicator text-center mb-2 md:mb-4">
                        <div class="inline-block px-2 md:px-4 py-1 rounded-full bg-purple-900 bg-opacity-50 text-purple-300 text-xs md:text-sm">
                            <span id="memory-status">Memorize</span>
                            <span id="memory-countdown" class="ml-1 md:ml-2 font-bold"></span>
                        </div>
                    </div>
                    
                    <div id="memory-grid" class="memory-grid grid-cols-${gridSize} mx-auto" style="max-width: min(90vw, 400px);">
                        ${Array(gridSize * gridSize).fill(0).map((_, index) => `
                            <div class="memory-cell" data-index="${index}"></div>
                        `).join('')}
                    </div>
                    
                    <div class="memory-progress mt-2 md:mt-4">
                        <div class="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span id="memory-progress-text">0/${numCells}</span>
                        </div>
                        <div class="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div id="memory-progress-bar" class="h-full bg-purple-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Progress bar -->
        <div class="relative z-10 w-full h-2 bg-gray-800">
            <div id="progress-bar" class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style="width: ${(gameState.currentQuiz.currentQuestionIndex / gameState.currentQuiz.questions.length) * 100}%"></div>
        </div>
        
        <!-- Pause Menu (initially hidden) -->
        <div id="pause-menu" class="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center hidden">
            <div class="neural-card p-4 md:p-8 w-full max-w-md text-center m-4">
                <h2 class="text-2xl md:text-3xl font-orbitron text-blue-400 mb-4 md:mb-6">PAUSED</h2>
                
                <div class="space-y-4 mb-6 md:mb-8">
                    <p class="text-gray-300">Neural challenge interrupted</p>
                </div>
                
                <div class="flex flex-col space-y-3">
                    <button id="resume-btn" class="cyber-button py-2 md:py-3">
                        RESUME CHALLENGE
                    </button>
                    <button id="restart-btn" class="cyber-button py-2 md:py-3">
                        RESTART CHALLENGE
                    </button>
                    <button id="quit-btn" class="cyber-button py-2 md:py-3 bg-red-900 bg-opacity-30 hover:bg-opacity-50">
                        QUIT CHALLENGE
                    </button>
                </div>
                
                ${!isMobile ? `<p class="text-gray-500 text-sm mt-4 md:mt-6">Press ESC to resume</p>` : ''}
            </div>
        </div>
    `;
    
    screens.main.appendChild(container);
    
    // Generate random pattern
    const totalCells = gridSize * gridSize;
    const pattern = [];
    while (pattern.length < numCells) {
        const randomIndex = Math.floor(Math.random() * totalCells);
        if (!pattern.includes(randomIndex)) {
            pattern.push(randomIndex);
        }
    }
    
    // Store pattern in game state
    gameState.currentQuiz.currentPattern = pattern;
    gameState.currentQuiz.userPattern = [];
    
    // Show countdown before showing pattern
    const countdownElement = document.getElementById('memory-countdown');
    const statusElement = document.getElementById('memory-status');
    let countdown = 3;
    
    countdownElement.textContent = countdown;
    
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            showMemoryPattern(pattern, challenge.memorizeTime);
        }
    }, 1000);
    
    // Add touch feedback for mobile
    if (isMobile) {
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.addEventListener('touchstart', () => {
                cell.classList.add('scale-105');
            });
            
            cell.addEventListener('touchend', () => {
                setTimeout(() => {
                    cell.classList.remove('scale-105');
                }, 150);
            });
        });
    }
}

// Show memory pattern
function showMemoryPattern(pattern, memorizeTime) {
    const statusElement = document.getElementById('memory-status');
    const countdownElement = document.getElementById('memory-countdown');
    
    statusElement.textContent = 'Memorize';
    countdownElement.textContent = Math.round(memorizeTime / 1000);
    
    // Show pattern with staggered animation
    pattern.forEach((index, i) => {
        setTimeout(() => {
            const cell = document.querySelector(`.memory-cell[data-index="${index}"]`);
            cell.classList.add('active', 'scale-in');
            playSound('blip');
        }, i * 300);
    });
    
    // Countdown for memorize time
    let timeLeft = Math.round(memorizeTime / 1000);
    const memorizeInterval = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(memorizeInterval);
            hideMemoryPattern();
        }
    }, 1000);
}

// Hide memory pattern and start recall phase
function hideMemoryPattern() {
    const statusElement = document.getElementById('memory-status');
    const countdownElement = document.getElementById('memory-countdown');
    
    // Hide all cells with staggered animation
    document.querySelectorAll('.memory-cell.active').forEach((cell, i) => {
        setTimeout(() => {
            cell.classList.remove('active', 'scale-in');
        }, i * 100);
    });
    
    setTimeout(() => {
        statusElement.textContent = 'Reproduce';
        countdownElement.textContent = '';
        
        document.getElementById('memory-instruction').textContent = 'Reproduce the pattern';
        
        // Add click listeners to cells
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const index = parseInt(cell.dataset.index);
                handleMemoryCellClick(cell, index);
            });
        });
        
        // Start timer
        startQuizTimer();
    }, 500);
}

// Handle memory cell click
function handleMemoryCellClick(cell, index) {
    const pattern = gameState.currentQuiz.currentPattern;
    const userPattern = gameState.currentQuiz.userPattern;
    
    // Prevent clicking the same cell twice
    if (userPattern.includes(index)) return;
    
    // Add to user pattern
    userPattern.push(index);
    
    // Update progress bar
    updateMemoryProgress(userPattern.length, pattern.length);
    
    // Visual feedback
    cell.classList.add('active');
    
    // Check if correct
    const isCorrect = pattern.includes(index);
    
    if (isCorrect) {
        cell.classList.add('correct-pick');
        playSound('correct');
    } else {
        cell.classList.add('wrong');
        playSound('wrong');
    }
    
    // Check if all cells have been selected
    if (userPattern.length === pattern.length) {
        // Calculate score
        const correctCells = userPattern.filter(i => pattern.includes(i)).length;
        const accuracy = correctCells / pattern.length;
        const points = Math.round(100 * accuracy + (gameState.currentQuiz.timeRemaining * 5 * accuracy));
        
        // Update score
        gameState.currentQuiz.score += points;
        
        // Show feedback
        showPointsFeedback(points);
        
        // Clear timer
        clearInterval(gameState.currentQuiz.timerInterval);
        
        // Show correct pattern
        pattern.forEach(patternIndex => {
            const patternCell = document.querySelector(`.memory-cell[data-index="${patternIndex}"]`);
            if (!userPattern.includes(patternIndex)) {
                patternCell.classList.add('correct', 'pulse-highlight');
            }
        });
        
        // Update status
        const statusElement = document.getElementById('memory-status');
        statusElement.textContent = `${correctCells}/${pattern.length} correct`;
        
        // Move to next question after delay
        setTimeout(() => {
            gameState.currentQuiz.currentQuestionIndex++;
            
            if (gameState.currentQuiz.currentQuestionIndex < gameState.currentQuiz.questions.length) {
                // Next question
                navigateTo('quiz');
            } else {
                // Quiz completed
                finishQuiz();
            }
        }, 2000);
    }
    
    // Add vibration feedback on mobile devices for correct/incorrect answers
    if (isMobile && navigator.vibrate) {
        if (isCorrect) {
            navigator.vibrate(50); // Short vibration for correct
        } else {
            navigator.vibrate([50, 50, 50]); // Pattern vibration for incorrect
        }
    }
}

// Update memory progress
function updateMemoryProgress(current, total) {
    const progressBar = document.getElementById('memory-progress-bar');
    const progressText = document.getElementById('memory-progress-text');
    
    if (progressBar && progressText) {
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${current}/${total}`;
    }
}

// Show points feedback
function showPointsFeedback(points) {
    const pointsElement = document.createElement('div');
    pointsElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-green-400 z-50 animate-bounce';
    pointsElement.textContent = `+${points}`;
    document.body.appendChild(pointsElement);
    
    setTimeout(() => {
        document.body.removeChild(pointsElement);
    }, 1000);
}

// Quiz timer
function startQuizTimer() {
    const timerElement = document.getElementById('timer');
    const currentQuestion = gameState.currentQuiz.questions[gameState.currentQuiz.currentQuestionIndex];
    
    const timerInterval = setInterval(() => {
        gameState.currentQuiz.timeRemaining--;
        
        if (timerElement) {
            timerElement.textContent = gameState.currentQuiz.timeRemaining;
            
            // Change color as time runs out
            if (gameState.currentQuiz.timeRemaining <= 10) {
                timerElement.classList.remove('text-blue-400', 'border-blue-500');
                timerElement.classList.add('text-orange-400', 'border-orange-500');
            }
            
            if (gameState.currentQuiz.timeRemaining <= 5) {
                timerElement.classList.remove('text-orange-400', 'border-orange-500');
                timerElement.classList.add('text-red-400', 'border-red-500', 'pulse');
            }
            
            // Add pulse animation for last 10 seconds
            if (gameState.currentQuiz.timeRemaining === 10) {
                timerElement.classList.add('animate-pulse');
            }
        }
        
        if (gameState.currentQuiz.timeRemaining <= 0) {
            clearInterval(timerInterval);
            handleAnswer(-1); // Time's up, no answer selected
        }
    }, 1000);
    
    // Store the interval ID to clear it if needed
    gameState.currentQuiz.timerInterval = timerInterval;
}

// Handle answer selection
function handleAnswer(selectedIndex) {
    // Clear timer
    clearInterval(gameState.currentQuiz.timerInterval);
    
    const currentQuestion = gameState.currentQuiz.questions[gameState.currentQuiz.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    
    // Calculate points based on time remaining and correctness
    let points = 0;
    if (isCorrect) {
        // Base points + time bonus
        points = 100 + (gameState.currentQuiz.timeRemaining * 5);
        gameState.currentQuiz.correctAnswers++;
        playSound('correct');
    } else {
        playSound('wrong');
    }
    
    gameState.currentQuiz.score += points;
    
    // Show feedback
    showAnswerFeedback(selectedIndex, currentQuestion.correctAnswer, points);
    
    // Move to next question after delay
    setTimeout(() => {
        gameState.currentQuiz.currentQuestionIndex++;
        
        if (gameState.currentQuiz.currentQuestionIndex < gameState.currentQuiz.questions.length) {
            // Next question
            navigateTo('quiz');
        } else {
            // Quiz completed
            finishQuiz();
        }
    }, 1500);
    
    // Add vibration feedback on mobile devices for correct/incorrect answers
    if (isMobile && navigator.vibrate) {
        if (isCorrect) {
            navigator.vibrate(50); // Short vibration for correct
        } else {
            navigator.vibrate([50, 50, 50]); // Pattern vibration for incorrect
        }
    }
}

// Show answer feedback
function showAnswerFeedback(selectedIndex, correctIndex, points) {
    const answerOptions = document.querySelectorAll('.answer-option');
    
    answerOptions.forEach((option, index) => {
        // Disable all options
        option.disabled = true;
        option.classList.add('pointer-events-none');
        
        if (index === correctIndex) {
            // Correct answer
            option.classList.add('border-green-500');
            option.classList.add('bg-green-900', 'bg-opacity-20');
            
            // Add animation to correct answer
            if (index === selectedIndex) {
                option.classList.add('scale-in');
                const numberCircle = option.querySelector('.answer-number');
                if (numberCircle) {
                    numberCircle.classList.remove('bg-gray-800');
                    numberCircle.classList.add('bg-green-600', 'text-white');
                }
            }
        } else if (index === selectedIndex) {
            // Selected wrong answer
            option.classList.add('border-red-500');
            option.classList.add('bg-red-900', 'bg-opacity-20');
            option.classList.add('shake');
            
            const numberCircle = option.querySelector('.answer-number');
            if (numberCircle) {
                numberCircle.classList.remove('bg-gray-800');
                numberCircle.classList.add('bg-red-600', 'text-white');
            }
        } else {
            // Fade out unselected options
            option.classList.add('opacity-50');
        }
    });
    
    // Show points if correct
    if (selectedIndex === correctIndex) {
        const pointsElement = document.createElement('div');
        pointsElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-green-400 z-50 animate-bounce';
        pointsElement.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                +${points}
            </div>
        `;
        document.body.appendChild(pointsElement);
        
        setTimeout(() => {
            document.body.removeChild(pointsElement);
        }, 1000);
    } else {
        // Show correct answer highlight
        const correctOption = answerOptions[correctIndex];
        correctOption.classList.add('pulse-highlight');
    }
}

// Finish quiz
function finishQuiz() {
    // Calculate stats
    const totalQuestions = gameState.currentQuiz.questions.length;
    const correctAnswers = gameState.currentQuiz.correctAnswers;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = Math.round((Date.now() - gameState.currentQuiz.startTime) / 1000);
    
    // Award XP
    let xpGained = Math.round(gameState.currentQuiz.score / 10);
    
    // Bonus XP for daily challenge
    if (gameState.currentQuiz.isDailyChallenge) {
        xpGained += 50; // Bonus XP for completing daily challenge
        
        // Mark daily challenge as completed
        gameState.dailyChallenge.completed = true;
        gameState.user.lastDailyChallenge = Date.now();
        
        // Update streak if not already updated today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastStreak = gameState.user.lastStreakUpdate ? new Date(gameState.user.lastStreakUpdate) : null;
        if (!lastStreak || lastStreak.getTime() < today.getTime()) {
            gameState.user.streakDays++;
            gameState.user.lastStreakUpdate = today.getTime();
        }
    }
    
    gameState.user.xp += xpGained;
    
    // Level up if needed
    if (gameState.user.xp >= 100) {
        gameState.user.level += Math.floor(gameState.user.xp / 100);
        gameState.user.xp = gameState.user.xp % 100;
    }
    
    // Record high score
    gameState.user.highScores.push({
        mode: getModeTitle(gameState.currentQuiz.mode),
        score: gameState.currentQuiz.score,
        accuracy: accuracy,
        date: Date.now()
    });
    
    // Sort high scores
    gameState.user.highScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 5 scores
    if (gameState.user.highScores.length > 5) {
        gameState.user.highScores = gameState.user.highScores.slice(0, 5);
    }
    
    // Navigate to results
    navigateTo('result');
}

// Result Screen
function renderResultScreen() {
    const resultScreen = document.createElement('div');
    resultScreen.className = 'h-full w-full neural-bg flex flex-col items-center justify-center overflow-y-auto';
    
    const totalQuestions = gameState.currentQuiz.questions.length;
    const correctAnswers = gameState.currentQuiz.correctAnswers;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = Math.round((Date.now() - gameState.currentQuiz.startTime) / 1000);
    
    // Calculate XP gained
    let xpGained = Math.round(gameState.currentQuiz.score / 10);
    if (gameState.currentQuiz.isDailyChallenge) {
        xpGained += 50; // Bonus XP for daily challenge
    }
    
    // Determine performance level
    let performanceLevel = 'Novice';
    let performanceColor = 'text-gray-400';
    
    if (accuracy >= 90) {
        performanceLevel = 'Neural Master';
        performanceColor = 'text-purple-400';
    } else if (accuracy >= 75) {
        performanceLevel = 'Synapse Expert';
        performanceColor = 'text-blue-400';
    } else if (accuracy >= 60) {
        performanceLevel = 'Cortex Adept';
        performanceColor = 'text-green-400';
    } else if (accuracy >= 40) {
        performanceLevel = 'Brain Trainee';
        performanceColor = 'text-yellow-400';
    }
    
    resultScreen.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        
        <div class="relative z-10 w-full max-w-2xl p-2 md:p-4 py-6 md:py-8">
            <div class="neural-card p-4 md:p-8 text-center result-card overflow-y-auto">
                <div class="result-header mb-4 md:mb-6">
                    <h2 class="text-2xl md:text-3xl font-orbitron text-blue-400 neon-text mb-2">NEURAL ANALYSIS</h2>
                    <p class="text-gray-400 mb-2 md:mb-4">
                        ${gameState.currentQuiz.isDailyChallenge ? 
                            '<span class="text-yellow-400">Daily Challenge</span> completed' : 
                            'Challenge completed'}
                    </p>
                    <div class="performance-badge ${performanceColor} font-orbitron text-base md:text-lg mb-2">
                        ${performanceLevel}
                    </div>
                </div>
                
                <div class="flex justify-center mb-6 md:mb-8 score-container">
                    <div class="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br ${getModeGradient(gameState.currentQuiz.mode)} flex flex-col items-center justify-center relative score-circle">
                        <div class="absolute inset-0 rounded-full score-glow"></div>
                        <div class="text-3xl md:text-4xl font-bold score-value">${gameState.currentQuiz.score}</div>
                        <div class="text-xs md:text-sm">POINTS</div>
                    </div>
                </div>
                
                <div class="stats-grid grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
                    <div class="stat-item text-center">
                        <div class="text-xl md:text-3xl font-bold text-blue-400 stat-value">${correctAnswers}/${totalQuestions}</div>
                        <div class="text-gray-400 text-sm stat-label">Correct Answers</div>
                        <div class="stat-bar">
                            <div class="h-1 w-full bg-gray-800 rounded-full mt-2">
                                <div class="h-full bg-blue-500 rounded-full" style="width: ${(correctAnswers / totalQuestions) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item text-center">
                        <div class="text-xl md:text-3xl font-bold text-purple-400 stat-value">${accuracy}%</div>
                        <div class="text-gray-400 text-sm stat-label">Accuracy</div>
                        <div class="stat-bar">
                            <div class="h-1 w-full bg-gray-800 rounded-full mt-2">
                                <div class="h-full bg-purple-500 rounded-full" style="width: ${accuracy}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item text-center">
                        <div class="text-xl md:text-3xl font-bold text-green-400 stat-value">+${xpGained}</div>
                        <div class="text-gray-400 text-sm stat-label">
                            XP Gained
                            ${gameState.currentQuiz.isDailyChallenge ? 
                                '<span class="text-yellow-400 text-xs ml-1">(+50 Bonus)</span>' : 
                                ''}
                        </div>
                        <div class="stat-bar">
                            <div class="h-1 w-full bg-gray-800 rounded-full mt-2">
                                <div class="h-full bg-green-500 rounded-full" style="width: ${Math.min(100, xpGained)}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item text-center">
                        <div class="text-xl md:text-3xl font-bold text-orange-400 stat-value">${timeTaken}s</div>
                        <div class="text-gray-400 text-sm stat-label">Time</div>
                        <div class="stat-bar">
                            <div class="h-1 w-full bg-gray-800 rounded-full mt-2">
                                <div class="h-full bg-orange-500 rounded-full" style="width: ${Math.min(100, (timeTaken / 120) * 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${gameState.currentQuiz.isDailyChallenge && gameState.user.streakDays > 1 ? `
                    <div class="mb-4 md:mb-6 p-3 bg-gradient-to-r from-yellow-500 to-orange-500 bg-opacity-20 rounded-lg streak-container">
                        <div class="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span class="text-yellow-400 font-bold streak-value">${gameState.user.streakDays} DAY STREAK!</span>
                        </div>
                        <p class="text-sm text-gray-200 mt-1">Keep completing daily challenges to maintain your streak</p>
                        
                        <div class="flex justify-center mt-2">
                            ${Array(7).fill(0).map((_, i) => `
                                <div class="h-1 md:h-2 w-1 md:w-2 mx-1 rounded-full ${i < gameState.user.streakDays % 7 ? 'bg-yellow-400' : 'bg-gray-600'}"></div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex justify-center space-x-2 md:space-x-4 action-buttons">
                    <button id="home-btn" class="cyber-button px-4 py-2 md:px-6 md:py-3 text-sm md:text-base">
                        RETURN TO HUB
                    </button>
                    <button id="retry-btn" class="cyber-button px-4 py-2 md:px-6 md:py-3 text-sm md:text-base">
                        ${gameState.currentQuiz.isDailyChallenge ? 'TRY ANOTHER' : 'RETRY'}
                    </button>
                </div>
            </div>
            
            ${!isMobile ? `<p class="text-gray-500 text-center mt-4 md:mt-6 text-xs md:text-sm">PRESS SPACE TO CONTINUE</p>` : ''}
        </div>
    `;
    
    screens.main.appendChild(resultScreen);
    
    // Add animations with setTimeout to trigger after render
    setTimeout(() => {
        // Animate score number counting up
        const scoreValue = document.querySelector('.score-value');
        if (scoreValue) {
            const finalScore = gameState.currentQuiz.score;
            let currentScore = 0;
            const duration = 1500; // ms
            const interval = 20; // ms
            const increment = Math.max(1, Math.floor(finalScore / (duration / interval)));
            
            const scoreCounter = setInterval(() => {
                currentScore = Math.min(currentScore + increment, finalScore);
                scoreValue.textContent = currentScore;
                
                if (currentScore >= finalScore) {
                    clearInterval(scoreCounter);
                }
            }, interval);
        }
        
        // Animate stat bars
        document.querySelectorAll('.stat-bar .bg-blue-500, .stat-bar .bg-purple-500, .stat-bar .bg-green-500, .stat-bar .bg-orange-500').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.transition = 'width 1s ease-out';
                bar.style.width = width;
            }, 300);
        });
        
        // Add entrance animations for stats
        document.querySelectorAll('.stat-item').forEach((item, index) => {
            item.classList.add('fade-in');
            item.style.animationDelay = `${index * 0.2}s`;
        });
    }, 100);
    
    // Event listeners
    document.getElementById('home-btn').addEventListener('click', () => {
        navigateTo('home');
    });
    
    document.getElementById('retry-btn').addEventListener('click', () => {
        if (gameState.currentQuiz.isDailyChallenge) {
            // If it was a daily challenge, go to quick challenge instead
            startQuiz('quick');
        } else {
            // Otherwise retry the same mode
            startQuiz(gameState.currentQuiz.mode);
        }
    });
    
    // Add swipe gesture for mobile to navigate from results screen to home
    if (isMobile) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        resultScreen.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        resultScreen.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            if (touchEndX - touchStartX > 100) { // Right swipe
                navigateTo('home');
            }
        }
    }
}

// Leaderboard Screen
function renderLeaderboardScreen() {
    const leaderboardScreen = document.createElement('div');
    leaderboardScreen.className = 'h-full w-full neural-bg';
    
    leaderboardScreen.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        
        <!-- Header -->
        <header class="relative z-10 p-4 flex items-center">
            <button id="back-btn" class="mr-4 h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 class="font-orbitron text-2xl text-blue-400 neon-text">NEURAL NETWORK</h2>
        </header>
        
        <!-- Main content -->
        <main class="relative z-10 p-4">
            <div class="neural-card p-6 mb-6">
                <div class="flex items-center mb-6">
                    <div class="avatar-frame h-16 w-16 flex items-center justify-center mr-4">
                        <div class="h-14 w-14 rounded-full bg-gradient-to-br ${getAvatarGradient(gameState.user.avatar)}"></div>
                    </div>
                    <div>
                        <h3 class="font-orbitron text-xl text-blue-400">${gameState.user.name}</h3>
                        <div class="flex items-center text-sm text-gray-400">
                            <span>Level ${gameState.user.level}</span>
                            <span class="mx-2">•</span>
                            <span>${gameState.user.cognitiveProfile.charAt(0).toUpperCase() + gameState.user.cognitiveProfile.slice(1)} Profile</span>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-blue-400">${gameState.user.highScores.length > 0 ? Math.max(...gameState.user.highScores.map(s => s.score)) : 0}</div>
                        <div class="text-gray-400 text-sm">Best Score</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-purple-400">${gameState.user.streakDays}</div>
                        <div class="text-gray-400 text-sm">Day Streak</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-green-400">${gameState.user.highScores.length}</div>
                        <div class="text-gray-400 text-sm">Challenges</div>
                    </div>
                </div>
            </div>
            
            <h3 class="font-orbitron text-xl text-white mb-4">Global Rankings</h3>
            
            <div class="neural-card p-4">
                <!-- This would be populated with real data from a server -->
                <div class="space-y-4">
                    <div class="flex items-center p-3 bg-blue-900 bg-opacity-20 rounded-lg">
                        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mr-3 font-bold">
                            1
                        </div>
                        <div class="flex-grow">
                            <div class="font-bold">NeuroMaster</div>
                            <div class="text-xs text-gray-400">Level 42 • Accelerator</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-yellow-400">24,850</div>
                            <div class="text-xs text-gray-400">98% acc</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center p-3 bg-gray-800 bg-opacity-20 rounded-lg">
                        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mr-3 font-bold">
                            2
                        </div>
                        <div class="flex-grow">
                            <div class="font-bold">SynapseQueen</div>
                            <div class="text-xs text-gray-400">Level 38 • Visualizer</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-gray-300">22,105</div>
                            <div class="text-xs text-gray-400">95% acc</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center p-3 bg-yellow-900 bg-opacity-10 rounded-lg">
                        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900 flex items-center justify-center mr-3 font-bold">
                            3
                        </div>
                        <div class="flex-grow">
                            <div class="font-bold">CortexKing</div>
                            <div class="text-xs text-gray-400">Level 35 • Analyzer</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-yellow-700">21,890</div>
                            <div class="text-xs text-gray-400">92% acc</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center p-3 rounded-lg border border-blue-500 border-opacity-50">
                        <div class="h-8 w-8 rounded-full bg-blue-900 flex items-center justify-center mr-3 font-bold">
                            24
                        </div>
                        <div class="flex-grow">
                            <div class="font-bold">${gameState.user.name}</div>
                            <div class="text-xs text-gray-400">Level ${gameState.user.level} • ${gameState.user.cognitiveProfile.charAt(0).toUpperCase() + gameState.user.cognitiveProfile.slice(1)}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-blue-400">${gameState.user.highScores.length > 0 ? Math.max(...gameState.user.highScores.map(s => s.score)) : 0}</div>
                            <div class="text-xs text-gray-400">${gameState.user.highScores.length > 0 ? Math.round(gameState.user.highScores.reduce((sum, s) => sum + s.accuracy, 0) / gameState.user.highScores.length) : 0}% acc</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `;
    
    screens.main.appendChild(leaderboardScreen);
    
    // Event listeners
    document.getElementById('back-btn').addEventListener('click', () => {
        navigateTo('home');
    });
}

// Helper function to get mode title
function getModeTitle(mode) {
    switch(mode) {
        case 'quick': return 'Quick Challenge';
        case 'memory': return 'Memory Matrix';
        case 'daily': return 'Daily Challenge';
        default: return 'Challenge';
    }
}

// Helper function to get mode gradient
function getModeGradient(mode) {
    switch(mode) {
        case 'quick': return 'from-blue-500 to-cyan-500';
        case 'memory': return 'from-purple-500 to-pink-500';
        case 'daily': return 'from-yellow-500 to-orange-500';
        default: return 'from-blue-500 to-purple-500';
    }
} 

// Toggle pause menu
function togglePause() {
    const pauseMenu = document.getElementById('pause-menu');
    
    if (pauseMenu.classList.contains('hidden')) {
        // Pause the game
        pauseMenu.classList.remove('hidden');
        // Stop the timer
        clearInterval(gameState.currentQuiz.timerInterval);
        playSound('blip');
    } else {
        // Resume the game
        pauseMenu.classList.add('hidden');
        // Restart the timer
        startQuizTimer();
        playSound('blip');
    }
} 

// Speed Synapse Challenge
function renderSpeedSynapseChallenge(container, challenge) {
    const numTargets = challenge.numTargets;
    const timePerTarget = challenge.timePerTarget;
    const timeLimit = challenge.timeLimit;
    
    container.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        
        <!-- Quiz Header -->
        <header class="relative z-10 p-4 flex justify-between items-center">
            <div class="flex items-center">
                <div class="mr-2 h-8 w-8 rounded-full bg-gradient-to-br ${getModeGradient('speed')} flex items-center justify-center text-white font-bold">
                    ${gameState.currentQuiz.currentQuestionIndex + 1}
                </div>
                <span class="text-gray-300">of ${gameState.currentQuiz.questions.length}</span>
            </div>
            
            <div class="flex items-center">
                <button id="pause-btn" class="mr-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <div class="text-right mr-4">
                    <div class="text-sm text-gray-400">Score</div>
                    <div class="text-blue-400 font-bold">${gameState.currentQuiz.score}</div>
                </div>
                <div id="timer" class="h-12 w-12 rounded-full border-2 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-400">
                    ${timeLimit}
                </div>
            </div>
        </header>
        
        <!-- Speed Synapse Content -->
        <div class="relative z-10 flex-grow flex flex-col items-center justify-center p-4">
            <div class="neural-card p-6 w-full max-w-3xl mx-auto mb-6">
                <h2 class="text-xl md:text-2xl text-white mb-6 text-center">
                    <span>Hit the targets as fast as possible</span>
                </h2>
                
                <div id="target-area" class="relative h-64 md:h-80 w-full border border-gray-700 rounded-lg bg-gray-900 bg-opacity-50 overflow-hidden">
                    <div id="targets-counter" class="absolute top-2 right-2 text-sm text-gray-400">
                        <span id="targets-hit">0</span>/<span id="total-targets">${numTargets}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Progress bar -->
        <div class="relative z-10 w-full h-1 bg-gray-800">
            <div id="progress-bar" class="h-full bg-gradient-to-r from-blue-500 to-purple-500" style="width: ${(gameState.currentQuiz.currentQuestionIndex / gameState.currentQuiz.questions.length) * 100}%"></div>
        </div>
        
        <!-- Pause Menu (initially hidden) -->
        <div id="pause-menu" class="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center hidden">
            <div class="neural-card p-8 w-full max-w-md text-center">
                <h2 class="text-3xl font-orbitron text-blue-400 mb-6">PAUSED</h2>
                
                <div class="space-y-4 mb-8">
                    <p class="text-gray-300">Neural challenge interrupted</p>
                </div>
                
                <div class="flex flex-col space-y-3">
                    <button id="resume-btn" class="cyber-button py-3">
                        RESUME CHALLENGE
                    </button>
                    <button id="restart-btn" class="cyber-button py-3">
                        RESTART CHALLENGE
                    </button>
                    <button id="quit-btn" class="cyber-button py-3 bg-red-900 bg-opacity-30 hover:bg-opacity-50">
                        QUIT CHALLENGE
                    </button>
                </div>
                
                <p class="text-gray-500 text-sm mt-6">Press ESC to resume</p>
            </div>
        </div>
    `;
    
    screens.main.appendChild(container);
    
    // Initialize speed challenge
    const targetArea = document.getElementById('target-area');
    const targetsHitElement = document.getElementById('targets-hit');
    
    // Store challenge state
    gameState.currentQuiz.targetsHit = 0;
    gameState.currentQuiz.totalTargets = numTargets;
    gameState.currentQuiz.targetTimes = [];
    gameState.currentQuiz.activeTarget = null;
    
    // Start timer
    startQuizTimer();
    
    // Create and show first target
    createTarget(targetArea, timePerTarget);
}

// Create target for speed challenge
function createTarget(targetArea, timePerTarget) {
    if (gameState.currentQuiz.targetsHit >= gameState.currentQuiz.totalTargets) {
        // All targets hit, calculate score
        finishSpeedChallenge();
        return;
    }
    
    // Remove any existing targets
    const existingTarget = document.querySelector('.target');
    if (existingTarget) {
        existingTarget.remove();
    }
    
    // Create new target
    const target = document.createElement('div');
    target.className = 'target';
    
    // Random position
    const areaWidth = targetArea.offsetWidth;
    const areaHeight = targetArea.offsetHeight;
    const targetSize = 60; // Size of target in pixels
    const padding = 20; // Padding from edges
    
    const left = padding + Math.random() * (areaWidth - targetSize - padding * 2);
    const top = padding + Math.random() * (areaHeight - targetSize - padding * 2);
    
    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    
    // Target content
    target.innerHTML = `
        <span class="text-white font-bold">${gameState.currentQuiz.targetsHit + 1}</span>
    `;
    
    // Add to DOM
    targetArea.appendChild(target);
    
    // Store start time
    const startTime = Date.now();
    gameState.currentQuiz.activeTarget = {
        element: target,
        startTime: startTime
    };
    
    // Add click event
    target.addEventListener('click', () => {
        handleTargetClick(target, startTime, timePerTarget);
    });
    
    // Auto-fail if not clicked in time
    setTimeout(() => {
        if (gameState.currentQuiz.activeTarget && gameState.currentQuiz.activeTarget.element === target) {
            // Target missed
            target.classList.add('hit');
            playSound('wrong');
            
            // Record miss
            gameState.currentQuiz.targetTimes.push({
                hit: false,
                time: timePerTarget * 1000
            });
            
            // Update counter
            gameState.currentQuiz.targetsHit++;
            document.getElementById('targets-hit').textContent = gameState.currentQuiz.targetsHit;
            
            // Create next target after delay
            setTimeout(() => {
                createTarget(targetArea, timePerTarget);
            }, 500);
        }
    }, timePerTarget * 1000);
}

// Handle target click
function handleTargetClick(target, startTime, timePerTarget) {
    // Calculate reaction time
    const endTime = Date.now();
    const reactionTime = endTime - startTime;
    
    // Visual feedback
    target.classList.add('hit');
    playSound('correct');
    
    // Record hit
    gameState.currentQuiz.targetTimes.push({
        hit: true,
        time: reactionTime
    });
    
    // Update counter
    gameState.currentQuiz.targetsHit++;
    document.getElementById('targets-hit').textContent = gameState.currentQuiz.targetsHit;
    
    // Create next target after delay
    setTimeout(() => {
        createTarget(document.getElementById('target-area'), timePerTarget);
    }, 300);
}

// Finish speed challenge
function finishSpeedChallenge() {
    // Clear timer
    clearInterval(gameState.currentQuiz.timerInterval);
    
    // Calculate score
    const times = gameState.currentQuiz.targetTimes;
    const hitCount = times.filter(t => t.hit).length;
    const totalTargets = gameState.currentQuiz.totalTargets;
    const accuracy = hitCount / totalTargets;
    
    // Calculate average reaction time (only for hits)
    const hitTimes = times.filter(t => t.hit).map(t => t.time);
    const avgReactionTime = hitTimes.length > 0 
        ? hitTimes.reduce((sum, time) => sum + time, 0) / hitTimes.length 
        : 1000; // Default if no hits
    
    // Score formula: accuracy + speed bonus
    const speedFactor = Math.max(0, 1 - (avgReactionTime / 1000)); // 0-1 scale, lower is better
    const points = Math.round(100 * accuracy + 200 * speedFactor);
    
    // Update score
    gameState.currentQuiz.score += points;
    
    // Show feedback
    showPointsFeedback(points);
    
    // Move to next question after delay
    setTimeout(() => {
        gameState.currentQuiz.currentQuestionIndex++;
        
        if (gameState.currentQuiz.currentQuestionIndex < gameState.currentQuiz.questions.length) {
            // Next question
            navigateTo('quiz');
        } else {
            // Quiz completed
            finishQuiz();
        }
    }, 1500);
} 

// Logic Circuit Challenge
function renderLogicCircuitChallenge(container, challenge) {
    const timeLimit = challenge.timeLimit;
    
    container.innerHTML = `
        <div class="absolute inset-0 cyber-grid"></div>
        
        <!-- Quiz Header -->
        <header class="relative z-10 p-4 flex justify-between items-center">
            <div class="flex items-center">
                <div class="mr-2 h-8 w-8 rounded-full bg-gradient-to-br ${getModeGradient('logic')} flex items-center justify-center text-white font-bold">
                    ${gameState.currentQuiz.currentQuestionIndex + 1}
                </div>
                <span class="text-gray-300">of ${gameState.currentQuiz.questions.length}</span>
            </div>
            
            <div class="flex items-center">
                <button id="pause-btn" class="mr-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <div class="text-right mr-4">
                    <div class="text-sm text-gray-400">Score</div>
                    <div class="text-blue-400 font-bold">${gameState.currentQuiz.score}</div>
                </div>
                <div id="timer" class="h-12 w-12 rounded-full border-2 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-400">
                    ${timeLimit}
                </div>
            </div>
        </header>
        
        <!-- Logic Circuit Content -->
        <div class="relative z-10 flex-grow flex flex-col items-center justify-center p-4">
            <div class="neural-card p-6 w-full max-w-3xl mx-auto mb-6">
                <h2 class="text-xl md:text-2xl text-white mb-6 text-center">
                    <span>${challenge.description}</span>
                </h2>
                
                <div id="circuit-area" class="relative h-64 md:h-80 w-full border border-gray-700 rounded-lg bg-gray-900 bg-opacity-50 overflow-hidden p-4">
                    <!-- Input nodes -->
                    <div class="flex justify-start mb-8">
                        ${challenge.inputs.map((value, index) => `
                            <div class="logic-node mr-8" data-value="${value}">
                                ${value ? 'TRUE' : 'FALSE'}
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Operator selection -->
                    <div class="flex justify-center mb-8">
                        <div class="bg-gray-800 p-2 rounded-lg">
                            ${challenge.operators.map(op => `
                                <button class="operator-btn mx-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded" data-operator="${op}">
                                    ${op}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Output node -->
                    <div class="flex justify-center">
                        <div id="output-node" class="logic-node border-dashed" data-value="false">
                            ?
                        </div>
                    </div>
                    
                    <!-- Target output -->
                    <div class="absolute top-2 right-2 text-sm">
                        <span class="text-gray-400">Target: </span>
                        <span class="text-green-400">${challenge.targetOutput ? 'TRUE' : 'FALSE'}</span>
                    </div>
                </div>
                
                <!-- Submit button -->
                <div class="flex justify-center mt-6">
                    <button id="submit-circuit" class="cyber-button px-8 py-3">
                        VERIFY CIRCUIT
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Progress bar -->
        <div class="relative z-10 w-full h-1 bg-gray-800">
            <div id="progress-bar" class="h-full bg-gradient-to-r from-blue-500 to-purple-500" style="width: ${(gameState.currentQuiz.currentQuestionIndex / gameState.currentQuiz.questions.length) * 100}%"></div>
        </div>
        
        <!-- Pause Menu (initially hidden) -->
        <div id="pause-menu" class="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center hidden">
            <div class="neural-card p-8 w-full max-w-md text-center">
                <h2 class="text-3xl font-orbitron text-blue-400 mb-6">PAUSED</h2>
                
                <div class="space-y-4 mb-8">
                    <p class="text-gray-300">Neural challenge interrupted</p>
                </div>
                
                <div class="flex flex-col space-y-3">
                    <button id="resume-btn" class="cyber-button py-3">
                        RESUME CHALLENGE
                    </button>
                    <button id="restart-btn" class="cyber-button py-3">
                        RESTART CHALLENGE
                    </button>
                    <button id="quit-btn" class="cyber-button py-3 bg-red-900 bg-opacity-30 hover:bg-opacity-50">
                        QUIT CHALLENGE
                    </button>
                </div>
                
                <p class="text-gray-500 text-sm mt-6">Press ESC to resume</p>
            </div>
        </div>
    `;
    
    screens.main.appendChild(container);
    
    // Initialize circuit state
    gameState.currentQuiz.circuitState = {
        selectedOperator: null,
        output: null
    };
    
    // Add event listeners to operator buttons
    document.querySelectorAll('.operator-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Deselect all operators
            document.querySelectorAll('.operator-btn').forEach(b => {
                b.classList.remove('bg-blue-600');
                b.classList.add('bg-gray-700');
            });
            
            // Select this operator
            btn.classList.remove('bg-gray-700');
            btn.classList.add('bg-blue-600');
            
            // Store selected operator
            const operator = btn.dataset.operator;
            gameState.currentQuiz.circuitState.selectedOperator = operator;
            
            // Calculate output
            calculateCircuitOutput(challenge);
            
            playSound('blip');
        });
    });
    
    // Add event listener to submit button
    document.getElementById('submit-circuit').addEventListener('click', () => {
        verifyCircuit(challenge);
    });
    
    // Add pause button event listener
    document.getElementById('pause-btn').addEventListener('click', () => {
        togglePause();
    });
    
    // Add pause menu button event listeners
    document.getElementById('resume-btn')?.addEventListener('click', () => {
        togglePause();
    });
    
    document.getElementById('restart-btn')?.addEventListener('click', () => {
        // Clear timer
        clearInterval(gameState.currentQuiz.timerInterval);
        // Restart the current quiz
        startQuiz('logic');
    });
    
    document.getElementById('quit-btn')?.addEventListener('click', () => {
        // Clear timer
        clearInterval(gameState.currentQuiz.timerInterval);
        // Return to home screen
        navigateTo('home');
    });
    
    // Start timer
    startQuizTimer();
}

// Calculate circuit output
function calculateCircuitOutput(challenge) {
    const operator = gameState.currentQuiz.circuitState.selectedOperator;
    if (!operator) return;
    
    const inputs = challenge.inputs;
    let output;
    
    // Special case for XOR challenge
    if (challenge.isXOR) {
        // For XOR, we're checking if they selected the right operator sequence
        // In a real implementation, this would be more complex
        if (operator === "OR") {
            output = inputs[0] !== inputs[1]; // This is XOR logic
        } else {
            output = false; // Simplified for this demo
        }
    } else {
        // Regular logic operations
        switch(operator) {
            case "AND":
                output = inputs[0] && inputs[1];
                break;
            case "OR":
                output = inputs[0] || inputs[1];
                break;
            case "NOT":
                output = !inputs[0]; // Apply to first input for simplicity
                break;
            default:
                output = false;
        }
    }
    
    // Update output node
    const outputNode = document.getElementById('output-node');
    outputNode.textContent = output ? 'TRUE' : 'FALSE';
    outputNode.dataset.value = output;
    
    // Highlight output based on correctness
    if (output === challenge.targetOutput) {
        outputNode.classList.add('border-green-500');
        outputNode.classList.remove('border-red-500', 'border-dashed');
    } else {
        outputNode.classList.add('border-red-500');
        outputNode.classList.remove('border-green-500', 'border-dashed');
    }
    
    // Store output
    gameState.currentQuiz.circuitState.output = output;
}

// Verify circuit solution
function verifyCircuit(challenge) {
    const output = gameState.currentQuiz.circuitState.output;
    
    // If no operator selected
    if (output === null) {
        const outputNode = document.getElementById('output-node');
        outputNode.classList.add('border-red-500');
        setTimeout(() => {
            outputNode.classList.remove('border-red-500');
        }, 1000);
        return;
    }
    
    // Check if output matches target
    const isCorrect = output === challenge.targetOutput;
    
    // Calculate points
    let points = 0;
    if (isCorrect) {
        points = 100 + (gameState.currentQuiz.timeRemaining * 5);
        gameState.currentQuiz.correctAnswers++;
        playSound('correct');
    } else {
        playSound('wrong');
    }
    
    // Update score
    gameState.currentQuiz.score += points;
    
    // Show feedback
    if (isCorrect) {
        showPointsFeedback(points);
    }
    
    // Clear timer
    clearInterval(gameState.currentQuiz.timerInterval);
    
    // Move to next question after delay
    setTimeout(() => {
        gameState.currentQuiz.currentQuestionIndex++;
        
        if (gameState.currentQuiz.currentQuestionIndex < gameState.currentQuiz.questions.length) {
            // Next question
            navigateTo('quiz');
        } else {
            // Quiz completed
            finishQuiz();
        }
    }, isCorrect ? 1500 : 2000);
} 

// Add a function to detect orientation changes and optimize layout
window.addEventListener('orientationchange', handleOrientationChange);

function handleOrientationChange() {
    // Force redraw of current screen to adjust for new orientation
    if (gameState.currentScreen) {
        setTimeout(() => {
            navigateTo(gameState.currentScreen);
        }, 300); // Small delay to allow orientation change to complete
    }
}

// Add a function to handle offline mode
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    
    // Show offline notification if needed
    if (!isOnline) {
        const offlineNotification = document.createElement('div');
        offlineNotification.className = 'fixed bottom-4 left-4 right-4 bg-red-900 text-white p-3 rounded-lg z-50 text-center';
        offlineNotification.textContent = 'You are offline. BrainQuest will continue to work, but some features may be limited.';
        document.body.appendChild(offlineNotification);
        
        setTimeout(() => {
            offlineNotification.remove();
        }, 5000);
    }
}