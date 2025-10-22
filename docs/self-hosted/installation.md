# Установка n8n Self-Hosted Edition

## 🐳 Установка с Docker (Рекомендуется)

### Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- Минимум 1GB свободного места на диске

### Быстрый старт

1. **Клонируйте репозиторий:**
```bash
git clone <your-repo-url>
cd n8n-self-hosted
```

2. **Создайте файл конфигурации:**
```bash
cp .env.example .env
```

3. **Настройте переменные окружения в `.env`:**
```env
# База данных
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_secure_password

# n8n настройки
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/

# Безопасность (ОБЯЗАТЕЛЬНО измените!)
N8N_ENCRYPTION_KEY=your_32_character_encryption_key

# Дополнительные настройки
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file
```

4. **Запустите приложение:**
```bash
docker-compose up -d
```

5. **Проверьте статус:**
```bash
docker-compose ps
```

6. **Откройте n8n в браузере:**
```
http://localhost:5678
```

### Первоначальная настройка

1. **Создайте администратора:**
   - Откройте http://localhost:5678
   - Заполните форму регистрации
   - Первый пользователь автоматически становится администратором

2. **Настройте аутентификацию (опционально):**
   - Перейдите в Settings > Authentication
   - Настройте LDAP или SAML

## 🖥️ Установка без Docker

### Предварительные требования

- Node.js 18.10+
- npm или yarn
- База данных (PostgreSQL, MySQL, SQLite, или MariaDB)

### Установка

1. **Клонируйте репозиторий:**
```bash
git clone <your-repo-url>
cd n8n-self-hosted
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Соберите приложение:**
```bash
npm run build
```

4. **Настройте переменные окружения:**
```bash
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=localhost
export DB_POSTGRESDB_PORT=5432
export DB_POSTGRESDB_DATABASE=n8n
export DB_POSTGRESDB_USER=n8n
export DB_POSTGRESDB_PASSWORD=your_password
export N8N_ENCRYPTION_KEY=your_32_character_encryption_key
export N8N_HOST=localhost
export N8N_PORT=5678
```

5. **Запустите приложение:**
```bash
npm start
```

## 🗄️ Настройка базы данных

### PostgreSQL (Рекомендуется)

```sql
-- Создайте базу данных
CREATE DATABASE n8n;

-- Создайте пользователя
CREATE USER n8n WITH PASSWORD 'your_password';

-- Предоставьте права
GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n;
```

### MySQL

```sql
-- Создайте базу данных
CREATE DATABASE n8n CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создайте пользователя
CREATE USER 'n8n'@'localhost' IDENTIFIED BY 'your_password';

-- Предоставьте права
GRANT ALL PRIVILEGES ON n8n.* TO 'n8n'@'localhost';
FLUSH PRIVILEGES;
```

### SQLite (для тестирования)

SQLite не требует дополнительной настройки. Просто укажите путь к файлу базы данных:

```env
DB_TYPE=sqlite
DB_SQLITE_DATABASE=/path/to/n8n.db
```

## 🔧 Конфигурация

### Основные настройки

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `N8N_HOST` | Хост для n8n | `localhost` |
| `N8N_PORT` | Порт для n8n | `5678` |
| `N8N_PROTOCOL` | Протокол (http/https) | `http` |
| `WEBHOOK_URL` | URL для webhook | `http://localhost:5678/` |
| `N8N_ENCRYPTION_KEY` | Ключ шифрования | **Обязательно** |

### Настройки базы данных

| Переменная | Описание |
|------------|----------|
| `DB_TYPE` | Тип БД (postgresdb, mysqldb, sqlite) |
| `DB_POSTGRESDB_HOST` | Хост PostgreSQL |
| `DB_POSTGRESDB_PORT` | Порт PostgreSQL |
| `DB_POSTGRESDB_DATABASE` | Имя базы данных |
| `DB_POSTGRESDB_USER` | Пользователь БД |
| `DB_POSTGRESDB_PASSWORD` | Пароль БД |

### Настройки безопасности

| Переменная | Описание |
|------------|----------|
| `N8N_ENCRYPTION_KEY` | 32-символьный ключ шифрования |
| `N8N_JWT_SECRET` | Секрет для JWT токенов |
| `N8N_USER_MANAGEMENT_DISABLED` | Отключить управление пользователями |

## 🔍 Проверка установки

### Проверка статуса

```bash
# Docker
docker-compose ps

# Без Docker
curl http://localhost:5678/healthz
```

### Проверка логов

```bash
# Docker
docker-compose logs -f n8n

# Без Docker
# Логи выводятся в консоль
```

### Проверка базы данных

```bash
# PostgreSQL
psql -h localhost -U n8n -d n8n -c "SELECT COUNT(*) FROM workflow_entity;"

# MySQL
mysql -h localhost -u n8n -p n8n -e "SELECT COUNT(*) FROM workflow_entity;"
```

## 🚨 Устранение неполадок

### Проблемы с подключением к БД

1. **Проверьте настройки подключения**
2. **Убедитесь, что БД запущена**
3. **Проверьте права пользователя**

### Проблемы с портами

1. **Убедитесь, что порт 5678 свободен**
2. **Проверьте файрвол**

### Проблемы с правами

1. **Убедитесь, что у пользователя есть права на запись**
2. **Проверьте права на папку с данными**

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте [Troubleshooting](troubleshooting.md)
2. Изучите логи приложения
3. Обратитесь к администратору системы
