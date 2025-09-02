# Система PNG Ассетов для GeometricJumper

## Обзор

Проект был адаптирован для использования PNG изображений вместо программной графики. Система поддерживает автоматический fallback к программной графике, если PNG ассеты недоступны.

## Структура папок

```
assets/
├── player/           # Ассеты игрока
├── collectibles/     # Коллекционные предметы
├── platforms/        # Платформы
└── backgrounds/      # Фоновые элементы
```

## Список ассетов

### Игрок (Player Assets)
**Рекомендуемые размеры: 40x40px**
- `player_idle.png` - Игрок в покое
- `player_jump.png` - Игрок в прыжке
- `player_magnet.png` - Игрок с активным магнитом
- `player_double_jump.png` - Игрок с двойным прыжком

### Коллекционные предметы (Collectibles)
**Рекомендуемые размеры:**
- `pixel_yellow.png` - Желтый пиксель (16x16px)
- `pixel_orange.png` - Оранжевый пиксель (18x18px)
- `pixel_purple.png` - Фиолетовый пиксель (20x20px)
- `pixel_red.png` - Красный пиксель (24x24px)
- `modifier_magnet.png` - Модификатор магнита (28x28px)
- `modifier_double_jump.png` - Модификатор двойного прыжка (28x28px)

### Платформы (Platforms)
**Рекомендуемые размеры:**
- `platform_grass.png` - Полная платформа с травой (200x40px)
- `platform_grass_left.png` - Левая часть платформы (50x40px)
- `platform_grass_center.png` - Центральная часть платформы (50x40px)
- `platform_grass_right.png` - Правая часть платформы (50x40px)

### Фоновые элементы (Backgrounds)
**Рекомендуемые размеры:**
- `cloud_small.png` - Маленькое облако (60x30px)
- `cloud_medium.png` - Среднее облако (80x40px)
- `cloud_large.png` - Большое облако (100x50px)
- `mountain_distant.png` - Дальние горы (200x100px)
- `mountain_near.png` - Ближние горы (150x120px)
- `tree_small.png` - Маленькое дерево (30x60px)
- `tree_medium.png` - Среднее дерево (40x80px)
- `tree_large.png` - Большое дерево (50x100px)
- `bush_small.png` - Маленький куст (25x20px)
- `bush_medium.png` - Средний куст (35x25px)
- `portal_ring.png` - Кольцо портала (80x80px)
- `portal_center.png` - Центр портала (40x40px)

## Важные особенности размеров

**PNG ассеты используются в их оригинальном размере!** Система не масштабирует изображения, поэтому важно создавать ассеты в рекомендуемых размерах.

### Рекомендации по созданию ассетов:

1. **Точные размеры** - создавайте ассеты точно в указанных размерах
2. **Прозрачность** - используйте PNG с альфа-каналом для прозрачности
3. **Центрирование** - важные элементы должны быть в центре изображения
4. **Качество** - используйте четкие, контрастные изображения

### Генерация ассетов

Для создания базовых PNG ассетов используйте любой графический редактор:

1. Создайте изображения в рекомендуемых размерах
2. Сохраните в формате PNG с прозрачностью
3. Поместите файлы в соответствующие папки в `assets/`

## Система загрузки

### AssetLoader класс

Система загрузки ассетов реализована в `js/assetLoader.js`:

```javascript
import { assetLoader, initAssets, getAssetWithFallback, hasAssets } from './assetLoader.js';

// Инициализация загрузки
await initAssets();

// Проверка доступности ассетов
if (hasAssets()) {
    // Использовать PNG ассеты
    const image = getAssetWithFallback('player_idle');
} else {
    // Fallback к программной графике
}
```

### Автоматический fallback

Все функции отрисовки поддерживают автоматический fallback:

1. **Сначала** пытается загрузить PNG изображение
2. **Если PNG недоступен** - использует программную графику
3. **Сохраняет** все анимации и эффекты

## Интеграция в код

### Рендерер (renderer.js)

```javascript
// Пример использования в функции отрисовки игрока
function drawPlayer(ctx, player) {
    const playerImage = getAssetWithFallback('player_idle');
    
    if (hasAssets() && playerImage) {
        // Отрисовка PNG изображения в оригинальном размере
        ctx.drawImage(playerImage, x - playerImage.width/2, y - playerImage.height/2);
    } else {
        // Fallback к программной графике
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, y, width, height);
    }
}
```

### Коллекционные предметы (collectibles.js)

```javascript
const PIXEL_YELLOW = {
    draw: (ctx, c) => {
        const image = getAssetWithFallback('pixel_yellow');
        if (hasAssets() && image) {
            // Отрисовка PNG изображения в оригинальном размере
            ctx.drawImage(image, c.x - image.width/2, c.y - image.height/2);
        } else {
            // Fallback к программной графике
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
```

## Производительность

### Оптимизации

1. **Кэширование** - загруженные изображения кэшируются в памяти
2. **Параллельная загрузка** - все ассеты загружаются одновременно
3. **Lazy loading** - ассеты загружаются только при необходимости
4. **Fallback** - мгновенный переход к программной графике при ошибках

### Рекомендации

1. **Размеры изображений** - создавайте ассеты точно в рекомендуемых размерах
2. **Формат** - PNG с прозрачностью для лучшего качества
3. **Оптимизация** - сжимайте изображения для уменьшения размера файлов
4. **Центрирование** - важные элементы должны быть в центре изображения

## Расширение системы

### Добавление новых ассетов

1. Добавьте путь к ассету в `ASSET_PATHS` в `assetLoader.js`
2. Обновите соответствующие функции отрисовки
3. Добавьте fallback к программной графике

### Пример добавления нового ассета

```javascript
// В assetLoader.js
export const ASSET_PATHS = {
    // ... существующие ассеты
    'new_asset': 'assets/category/new_asset.png'
};

// В функции отрисовки
function drawNewElement(ctx, element) {
    const image = getAssetWithFallback('new_asset');
    if (hasAssets() && image) {
        // Отрисовка PNG изображения в оригинальном размере
        ctx.drawImage(image, element.x - image.width/2, element.y - image.height/2);
    } else {
        // Fallback к программной графике
        ctx.fillStyle = '#color';
        ctx.fillRect(element.x, element.y, element.width, element.height);
    }
}
```

## Отладка

### Проверка загрузки ассетов

```javascript
// В консоли браузера
console.log('Assets loaded:', hasAssets());
console.log('Asset loader progress:', assetLoader.getProgress());
console.log('Specific asset:', assetLoader.getAsset('player_idle'));
```

### Логи загрузки

Система автоматически выводит логи в консоль:
- Успешная загрузка ассетов
- Ошибки загрузки
- Fallback к программной графике

## Совместимость

- **Браузеры**: Все современные браузеры с поддержкой ES6 модулей
- **Fallback**: Автоматический переход к программной графике
- **Производительность**: Оптимизировано для мобильных устройств
