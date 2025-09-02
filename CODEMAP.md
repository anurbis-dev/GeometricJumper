## Карта кода (модули и основные API)

Легенда
- Формат: модуль → экспортируемые функции/сущности (краткое назначение)

index.html
- Точки монтирования UI: `#gameCanvas`, оверлеи/меню, подключение Tone.js и `js/main.js`.

css/style.css
- Адаптивный контейнер 16:9, слои оверлеев, меню, HUD, стили кнопок.

js/main.js
- startGame(): запуск новой игры и уровня
- startNextLevel(): переход к следующему уровню
- restartCurrentLevel(): рестарт текущего уровня
- resumeGame(): продолжить из паузы
- startGameplay(): первый старт движения на уровне
- exitToMainMenu(): вернуться в главное меню
- gameLoop(ts): кадр цикла; вызывает updatePhysics и draw
- resizeCanvas(canvas): делегирован в renderer
- Инициализирует UI и Input; подписывается на resize/fullscreen

js/constants.js
- BASE_SPEED, GRAVITY, JUMP_FORCE, PLAYER_ROTATION_SPEED, PLATFORM_HEIGHT

js/renderer.js
- resizeCanvas(canvas): считает размеры контейнера, выставляет canvas, initCamera
- preRenderLevel(ctx, levelData, w, h): подложка платформ и окружения на offscreen canvas
- draw(ctx, canvas, dt): фон, параллакс, платформы, деревья/кусты, collectibles, портал, игрок, частицы
- (внутр.) drawPlayer, drawPortal, drawParallaxLayer, drawTreeOrBush, drawGrassOnPlatform

js/physics.js
- getParticles()
- getGameState() / setGameState(state)
- getTimeScale() / setTimeScaleTarget(target)
- getLevelStats() { startTime, pixelsCollected, deaths }
- getLastSafePlatform() / getRespawnTarget()
- getTotalScore()
- updatePhysics(dt, canvas, levelData): коллизии/портал/частицы/таймскейл
- awardBonus()
- resetPlayer(): респавн в начало уровня
- die(): смерть, частицы, панорамирование камеры
- finalizeRespawn(): завершение респавна
- completeLevel(): плавное завершение уровня
- resetScoreOnNewGame(), resetLevelStats(), resetCurrentLevelState()

js/player.js
- getPlayer(): объект игрока (позиция, скорость, размеры, эффекты)
- setPlayerSpeed(speed)
- resetPlayerState(): сбрасывает эффекты и двойной прыжок
- performPlayerJump(): логика прыжка/двойного прыжка
- updatePlayer(scaledDt, activePlatforms): перемещение, коллизии, вращение, события приземления

js/levelGenerator.js
- getGeneratedLevelData() / setGeneratedLevelData(data)
- generateLevel(currentLevel, canvasHeight): платформы, collectibles, портал, параллакс и индексы активных списков
- (внутр.) generateBottomShape(p), generateParallaxElements(...)

js/camera.js
- getCamera()
- initCamera(canvas): оффсеты от размера экрана
- snapCameraToPlayer()
- updateCamera(dt): плавное следование и панорамирование к респавну

js/input.js
- initInput({ onJump, onResume, onPause }): подписка на события
- getAutoJumpState(): тач-автопрыжок
- togglePause(): пауза/возврат
- playerJump(): вызвать прыжок по колбэку

js/ui.js
- initUI({...}): связывает кнопки/меню с колбэками main
- showMenu(kind): 'main' | 'pause' | 'levelEnd' | null
- updateScoreUI(v), updateLevelUI(v), updateDeathsUI(v)
- showLevelEndMenu(level, totalPixels, bonus)
- fadeScreen(toOpacity, ms)
- showStartBanner(level, totalPixels)

js/collectibles.js
- createCollectible(typeName, x, y)
- COLLECTIBLE_TYPES: словарь типов с цветом/значением/эффектом
- drawCollectibles(ctx, list)
- updateCollectibles(list, dt): сбор и применение эффектов
- resetAllCollectibles(list)

js/audio/
- audio.js: initAudio(), generateMusic(), startTransport(), stopTransport(), pauseTransport(), setPortalVolume(player, portal, screenW), playMenuSound, playVictorySound, playJumpSound, playLandSound, playDeathSound
- sfx.js: конкретные SFX генераторы/буферы
- music/proceduralMusic.js: треки/паттерны Tone.js

Жизненный цикл уровня
- Создание: `startGame`/`startNextLevel` → `generateLevel` → `preRenderLevel` → `resetPlayer` → `snapCameraToPlayer` → `levelReady`.
- Старт: первый прыжок или авто-жест → `startGameplay` → `startTransport` (музыка).
- Игровой цикл: `updatePhysics` + `draw`.
- Смерть: `die` → частицы → `panningToRespawn` → `finalizeRespawn`.
- Завершение: вход в портал → `completeLevel` → `levelEnd` → меню.

