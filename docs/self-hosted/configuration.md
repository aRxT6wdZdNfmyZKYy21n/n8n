# Конфигурация n8n Self-Hosted Edition

## 🔧 Основные настройки

### Переменные окружения

Все настройки n8n Self-Hosted Edition управляются через переменные окружения.

#### Обязательные настройки

```env
# Ключ шифрования (32 символа)
N8N_ENCRYPTION_KEY=your_32_character_encryption_key_here

# База данных
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_password
```

#### Основные настройки приложения

```env
# Хост и порт
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http

# Webhook URL
WEBHOOK_URL=http://localhost:5678/

# Логирование
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file
```

## 🗄️ Настройки базы данных

### PostgreSQL (Рекомендуется)

```env
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_password
DB_POSTGRESDB_SCHEMA=public
DB_POSTGRESDB_SSL_ENABLED=false
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=true
```

### MySQL

```env
DB_TYPE=mysqldb
DB_MYSQLDB_HOST=localhost
DB_MYSQLDB_PORT=3306
DB_MYSQLDB_DATABASE=n8n
DB_MYSQLDB_USER=n8n
DB_MYSQLDB_PASSWORD=your_password
DB_MYSQLDB_CHARSET=utf8mb4
```

### SQLite

```env
DB_TYPE=sqlite
DB_SQLITE_DATABASE=/path/to/n8n.db
```

## 🔐 Настройки безопасности

### Шифрование

```env
# Ключ шифрования (обязательно)
N8N_ENCRYPTION_KEY=your_32_character_encryption_key_here

# JWT секрет
N8N_JWT_SECRET=your_jwt_secret_here
```

### Управление пользователями

```env
# Отключить управление пользователями (только LDAP/SAML)
N8N_USER_MANAGEMENT_DISABLED=false

# Настройки сессий
N8N_SESSION_LIFETIME=168  # часы
N8N_SESSION_COOKIE_SECURE=true
N8N_SESSION_COOKIE_SAME_SITE=strict
```

## 🌐 Настройки сети

### Webhook

```env
# URL для webhook
WEBHOOK_URL=http://localhost:5678/

# Дополнительные настройки webhook
N8N_WEBHOOK_URL=http://localhost:5678/
N8N_WEBHOOK_TUNNEL_URL=https://your-tunnel-url.com
```

### CORS

```env
# Настройки CORS
N8N_CORS_ORIGIN=*
N8N_CORS_CREDENTIALS=true
```

## 📊 Настройки производительности

### Выполнение workflow

```env
# Режим выполнения
EXECUTIONS_MODE=regular  # regular, queue

# Лимиты выполнения
EXECUTIONS_TIMEOUT=3600  # секунды
EXECUTIONS_TIMEOUT_MAX=7200  # секунды
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_MANUAL_EXECUTION=true
EXECUTIONS_DATA_SAVE_ON_PROGRESS=false
```

### Очередь (если используется)

```env
# Настройки очереди
QUEUE_BULL_REDIS_HOST=localhost
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=
QUEUE_BULL_REDIS_DB=0
```

## 📁 Настройки файлов

### Загрузка файлов

```env
# Режим хранения файлов
N8N_DEFAULT_BINARY_DATA_MODE=filesystem  # filesystem, s3

# Настройки файловой системы
N8N_BINARY_DATA_TTL=24  # часы
N8N_BINARY_DATA_STORAGE_PATH=/tmp/n8n
```

### S3 (если используется)

```env
# Настройки S3
N8N_BINARY_DATA_S3_BUCKET=your-bucket
N8N_BINARY_DATA_S3_REGION=us-east-1
N8N_BINARY_DATA_S3_ACCESS_KEY_ID=your-access-key
N8N_BINARY_DATA_S3_SECRET_ACCESS_KEY=your-secret-key
N8N_BINARY_DATA_S3_ENDPOINT=https://s3.amazonaws.com
```

## 🔍 Настройки логирования

### Уровни логирования

```env
# Уровень логирования
N8N_LOG_LEVEL=info  # error, warn, info, debug

# Вывод логов
N8N_LOG_OUTPUT=console,file  # console, file, both
```

### Файлы логов

```env
# Путь к файлу логов
N8N_LOG_FILE=/var/log/n8n/n8n.log

# Ротация логов
N8N_LOG_FILE_MAX_SIZE=16777216  # байты
N8N_LOG_FILE_MAX_FILES=5
```

## 🎨 Настройки интерфейса

### Персонализация

```env
# Настройки интерфейса
N8N_PERSONALIZATION_ENABLED=true
N8N_DISABLE_UI=false
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false
```

### Темы

```env
# Цветовая схема
N8N_DEFAULT_LOCALE=en
N8N_CUSTOM_EXTENSIONS=/path/to/extensions
```

## 🔧 Дополнительные настройки

### Отладка

```env
# Режим отладки
N8N_DEBUG=true
N8N_DEBUG_DB=false
N8N_DEBUG_PAYLOAD=false
```

### Метаданные

```env
# Метаданные экземпляра
N8N_METADATA_INSTANCE_ID=your-instance-id
N8N_METADATA_USER_ID=your-user-id
```

## 📋 Пример полной конфигурации

### Docker Compose

```yaml
version: '3.8'

services:
  n8n:
    image: n8n-self-hosted:latest
    ports:
      - "5678:5678"
    environment:
      # Основные настройки
      N8N_HOST: localhost
      N8N_PORT: 5678
      N8N_PROTOCOL: http
      WEBHOOK_URL: http://localhost:5678/
      
      # Безопасность
      N8N_ENCRYPTION_KEY: your_32_character_encryption_key_here
      N8N_JWT_SECRET: your_jwt_secret_here
      
      # База данных
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: your_password
      
      # Логирование
      N8N_LOG_LEVEL: info
      N8N_LOG_OUTPUT: console,file
      
      # Производительность
      EXECUTIONS_MODE: regular
      EXECUTIONS_TIMEOUT: 3600
      
    volumes:
      - n8n_data:/home/node/.n8n
      - /var/log/n8n:/var/log/n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

### .env файл

```env
# Основные настройки
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/

# Безопасность
N8N_ENCRYPTION_KEY=your_32_character_encryption_key_here
N8N_JWT_SECRET=your_jwt_secret_here

# База данных
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_password

# Логирование
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file

# Производительность
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_MANUAL_EXECUTION=true

# Файлы
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
N8N_BINARY_DATA_TTL=24
N8N_BINARY_DATA_STORAGE_PATH=/tmp/n8n

# Интерфейс
N8N_PERSONALIZATION_ENABLED=true
N8N_DEFAULT_LOCALE=en
```

## 🔍 Проверка конфигурации

### Проверка переменных окружения

```bash
# Проверить все переменные n8n
env | grep N8N

# Проверить переменные базы данных
env | grep DB_
```

### Проверка подключения к БД

```bash
# PostgreSQL
psql -h localhost -U n8n -d n8n -c "SELECT version();"

# MySQL
mysql -h localhost -u n8n -p n8n -e "SELECT VERSION();"
```

### Проверка webhook

```bash
# Проверить доступность webhook
curl -X GET http://localhost:5678/webhook-test/test
```

## 🚨 Устранение неполадок

### Проблемы с конфигурацией

1. **Проверьте синтаксис переменных окружения**
2. **Убедитесь, что все обязательные переменные установлены**
3. **Проверьте права доступа к файлам и папкам**

### Проблемы с БД

1. **Проверьте настройки подключения**
2. **Убедитесь, что БД запущена и доступна**
3. **Проверьте права пользователя БД**

### Проблемы с производительностью

1. **Настройте лимиты выполнения**
2. **Используйте очередь для больших нагрузок**
3. **Оптимизируйте настройки БД**
