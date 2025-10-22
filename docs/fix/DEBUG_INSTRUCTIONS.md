# Инструкции по отладке ошибки "Cannot read properties of undefined (reading 'split')"

## Что было исправлено

### 1. Основная проблема в `digestAuthAxiosConfig`
- **Местоположение**: `packages/core/src/execution-engine/node-execution-context/utils/request-helper-functions.ts:307-309`
- **Проблема**: Вызов `.split(',')` на `response.headers['www-authenticate']` без проверки на `undefined`
- **Исправление**: Добавлена проверка на существование и тип заголовка

### 2. Потенциальная проблема в `createOAuth2Client`
- **Местоположение**: `packages/core/src/execution-engine/node-execution-context/utils/request-helper-functions.ts:957`
- **Проблема**: Вызов `.split(' ')` на `credentials.scope` без проверки на `undefined`
- **Исправление**: Добавлена проверка `credentials.scope ? credentials.scope.split(' ') : []`

### 3. Улучшенная проверка в OAuth2 Authorization header
- **Местоположение**: `packages/core/src/execution-engine/node-execution-context/utils/request-helper-functions.ts:1094-1102`
- **Проблема**: Потенциальная ошибка при разборе Authorization header
- **Исправление**: Добавлена проверка длины массива после split

## Добавленное логирование

### Детальное логирование в ключевых функциях:

1. **`digestAuthAxiosConfig`** - логирует:
   - Статус ответа
   - Все заголовки ответа
   - Значение и тип www-authenticate заголовка
   - Результат парсинга authDetails
   - Найденные realm и nonce

2. **`createOAuth2Client`** - логирует:
   - Значение и тип credentials.scope
   - Обработанные scopes

3. **`getAgentWithProxy`** - логирует:
   - Целевой URL
   - Конфигурацию прокси
   - Разрешенный URL прокси
   - Выбранный протокол

4. **`invokeAxios`** - логирует:
   - Детали запроса
   - Ошибки и их типы
   - Процесс retry для digest auth

5. **Axios interceptor** - логирует:
   - Каждый HTTP запрос
   - Применение агентов

## Как использовать для отладки

### 1. Сборка контейнера
```bash
# Соберите контейнер с изменениями
docker build -t n8n-debug .

# Или если используете docker-compose
docker-compose build
```

### 2. Запуск с логированием
```bash
# Запустите контейнер
docker run -p 5678:5678 n8n-debug

# Или с docker-compose
docker-compose up
```

### 3. Мониторинг логов
```bash
# Просмотр логов в реальном времени
docker logs -f <container_id>

# Или с docker-compose
docker-compose logs -f
```

### 4. Фильтрация отладочных сообщений
```bash
# Только отладочные сообщения
docker logs <container_id> 2>&1 | grep "\[DEBUG\]"

# Только ошибки
docker logs <container_id> 2>&1 | grep "\[ERROR\]"

# Только предупреждения
docker logs <container_id> 2>&1 | grep "\[WARNING\]"
```

## Ожидаемые логи при воспроизведении ошибки

### При успешном запросе:
```
[DEBUG] Axios request interceptor called
[DEBUG] config.url: https://api.telegram.org/bot8123702626:AAFU41wYj962B7dUaqFTW_2L_veSAvB_GHo/getWebhookInfo
[DEBUG] getTargetUrlFromAxiosConfig called
[DEBUG] resolved target URL: https://api.telegram.org/bot8123702626:AAFU41wYj962B7dUaqFTW_2L_veSAvB_GHo/getWebhookInfo
[DEBUG] getAgentWithProxy called
[DEBUG] Using direct agent
[DEBUG] Agent applied to config
```

### При ошибке digest auth:
```
[DEBUG] invokeAxios called
[DEBUG] Making initial axios request
[DEBUG] Initial request failed, checking for digest auth retry
[DEBUG] Response status: 401
[DEBUG] www-authenticate header: Digest realm="test", nonce="abc123"
[DEBUG] Attempting digest auth retry
[DEBUG] digestAuthAxiosConfig called
[DEBUG] www-authenticate header: Digest realm="test", nonce="abc123"
[DEBUG] Processing www-authenticate: Digest realm="test", nonce="abc123"
[DEBUG] Parsed authDetails: [["Digest realm", "test"], [" nonce", "abc123"]]
[DEBUG] realm found: test
[DEBUG] nonce found: abc123
```

### При ошибке с undefined:
```
[ERROR] www-authenticate header is missing or undefined
[ERROR] www-authenticate header is not a string: undefined
[ERROR] realm not found in www-authenticate header
[ERROR] nonce not found in www-authenticate header
```

## Тестирование исправлений

### 1. Тест с корректным www-authenticate заголовком
```bash
# Запрос, который должен работать
curl -H "www-authenticate: Digest realm=\"test\", nonce=\"abc123\"" http://localhost:5678/test
```

### 2. Тест с отсутствующим заголовком
```bash
# Запрос без www-authenticate заголовка
curl http://localhost:5678/test
```

### 3. Тест с некорректным заголовком
```bash
# Запрос с некорректным www-authenticate заголовком
curl -H "www-authenticate: Invalid format" http://localhost:5678/test
```

## Ожидаемые результаты

После применения исправлений:
1. **Ошибка "Cannot read properties of undefined (reading 'split')" больше не должна возникать**
2. **Детальные логи помогут понять, где именно происходит проблема**
3. **Корректная обработка случаев с отсутствующими заголовками**
4. **Более информативные сообщения об ошибках**

## Откат изменений

Если нужно откатить изменения:
```bash
git checkout HEAD -- packages/core/src/execution-engine/node-execution-context/utils/request-helper-functions.ts
```

## Дополнительные проверки

После тестирования проверьте:
1. Все HTTP запросы работают корректно
2. OAuth2 аутентификация функционирует
3. Digest аутентификация работает при необходимости
4. Нет новых ошибок в логах
