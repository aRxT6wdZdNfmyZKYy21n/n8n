# Развертывание n8n Self-Hosted Edition

## 🚀 Быстрый старт

### Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- Минимум 1GB свободного места на диске

### Установка за 5 минут

1. **Клонируйте репозиторий:**
```bash
git clone <your-repo-url>
cd n8n-self-hosted
```

2. **Настройте конфигурацию:**
```bash
cp env.example .env
# Отредактируйте .env файл
```

3. **Запустите приложение:**
```bash
docker-compose -f docker-compose.self-hosted.yml up -d
```

4. **Откройте n8n:**
```
http://localhost:5678
```

## 🐳 Развертывание с Docker

### Простое развертывание

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd n8n-self-hosted

# Настройте переменные окружения
cp env.example .env
nano .env  # Отредактируйте настройки

# Запустите
docker-compose -f docker-compose.self-hosted.yml up -d

# Проверьте статус
docker-compose -f docker-compose.self-hosted.yml ps
```

### Продакшен развертывание

```bash
# Создайте продакшен конфигурацию
cp env.example .env.production

# Настройте продакшен переменные
nano .env.production

# Запустите в продакшене
docker-compose -f docker-compose.self-hosted.yml --env-file .env.production up -d
```

## 🖥️ Развертывание без Docker

### Предварительные требования

- Node.js 18.10+
- npm или yarn
- База данных (PostgreSQL, MySQL, SQLite)

### Установка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd n8n-self-hosted

# Установите зависимости
npm install

# Соберите приложение
npm run build

# Настройте переменные окружения
cp env.example .env
nano .env

# Запустите
npm start
```

## 🔧 Конфигурация

### Обязательные настройки

```env
# Безопасность (ОБЯЗАТЕЛЬНО измените!)
N8N_ENCRYPTION_KEY=your_32_character_encryption_key_here
N8N_JWT_SECRET=your_jwt_secret_here

# База данных
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_password

# Webhook URL (измените на ваш домен)
WEBHOOK_URL=http://localhost:5678/
```

### Дополнительные настройки

```env
# Логирование
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file

# Производительность
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600

# Файлы
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
N8N_BINARY_DATA_TTL=24
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

### SQLite

```env
# SQLite не требует дополнительной настройки
DB_TYPE=sqlite
DB_SQLITE_DATABASE=/path/to/n8n.db
```

## 🔐 Настройка аутентификации

### Email/Password (по умолчанию)

Не требует дополнительной настройки. Первый пользователь автоматически становится администратором.

### LDAP

```env
# LDAP настройки
LDAP_HOST=ldap://your-ldap-server.com
LDAP_PORT=389
LDAP_BIND_DN=cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD=your_password
LDAP_BASE_DN=dc=company,dc=com
LDAP_USER_FILTER=(uid={{username}})
```

### SAML

```env
# SAML настройки
SAML_ENTITY_ID=https://your-n8n-instance.com
SAML_SSO_URL=https://your-saml-provider.com/sso
SAML_CERTIFICATE=-----BEGIN CERTIFICATE-----
your_certificate_here
-----END CERTIFICATE-----
```

## 🌐 Настройка веб-сервера

### Nginx (рекомендуется)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5678/
    ProxyPassReverse / http://localhost:5678/
</VirtualHost>
```

## 🔒 HTTPS настройка

### Let's Encrypt с Nginx

```bash
# Установите Certbot
sudo apt install certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d your-domain.com

# Настройте автообновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Обновите конфигурацию n8n

```env
# HTTPS настройки
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-domain.com/
N8N_SESSION_COOKIE_SECURE=true
```

## 📊 Мониторинг

### Проверка статуса

```bash
# Docker
docker-compose -f docker-compose.self-hosted.yml ps

# Без Docker
curl http://localhost:5678/healthz
```

### Логи

```bash
# Docker
docker-compose -f docker-compose.self-hosted.yml logs -f n8n

# Без Docker
tail -f /var/log/n8n/n8n.log
```

### Метрики

```bash
# Проверка использования ресурсов
docker stats

# Проверка базы данных
psql -h localhost -U n8n -d n8n -c "SELECT COUNT(*) FROM workflow_entity;"
```

## 🔄 Обновление

### Обновление Docker версии

```bash
# Остановите приложение
docker-compose -f docker-compose.self-hosted.yml down

# Обновите код
git pull

# Пересоберите образ
docker-compose -f docker-compose.self-hosted.yml build

# Запустите обновленную версию
docker-compose -f docker-compose.self-hosted.yml up -d
```

### Обновление без Docker

```bash
# Остановите приложение
pm2 stop n8n

# Обновите код
git pull

# Установите зависимости
npm install

# Пересоберите
npm run build

# Запустите
pm2 start n8n
```

## 🚨 Устранение неполадок

### Проблемы с подключением к БД

```bash
# Проверьте подключение к PostgreSQL
psql -h localhost -U n8n -d n8n -c "SELECT version();"

# Проверьте подключение к MySQL
mysql -h localhost -u n8n -p n8n -e "SELECT VERSION();"
```

### Проблемы с портами

```bash
# Проверьте, что порт 5678 свободен
netstat -tulpn | grep 5678

# Проверьте файрвол
sudo ufw status
```

### Проблемы с правами

```bash
# Проверьте права на папку с данными
ls -la /home/node/.n8n

# Исправьте права
sudo chown -R node:node /home/node/.n8n
```

### Проблемы с памятью

```bash
# Проверьте использование памяти
free -h

# Проверьте логи на ошибки памяти
dmesg | grep -i "out of memory"
```

## 📋 Чек-лист развертывания

### Перед развертыванием

- [ ] Установлен Docker и Docker Compose
- [ ] Настроены переменные окружения
- [ ] Изменены ключи безопасности
- [ ] Настроена база данных
- [ ] Настроен домен (для продакшена)

### После развертывания

- [ ] Приложение доступно по URL
- [ ] Создан первый пользователь
- [ ] Настроена аутентификация
- [ ] Проверены логи
- [ ] Настроен мониторинг
- [ ] Настроен бэкап

### Продакшен чек-лист

- [ ] Настроен HTTPS
- [ ] Настроен файрвол
- [ ] Настроен мониторинг
- [ ] Настроен бэкап
- [ ] Настроено логирование
- [ ] Настроена аутентификация
- [ ] Проведено тестирование

## 🆘 Поддержка

### Логи и диагностика

```bash
# Получить логи приложения
docker-compose -f docker-compose.self-hosted.yml logs n8n

# Проверить статус контейнеров
docker-compose -f docker-compose.self-hosted.yml ps

# Проверить использование ресурсов
docker stats
```

### Полезные команды

```bash
# Перезапустить приложение
docker-compose -f docker-compose.self-hosted.yml restart

# Остановить приложение
docker-compose -f docker-compose.self-hosted.yml down

# Очистить данные (ОСТОРОЖНО!)
docker-compose -f docker-compose.self-hosted.yml down -v
```

### Контакты

- Документация: `/docs/self-hosted/`
- Логи: `/var/log/n8n/`
- Конфигурация: `.env`
- Данные: `/home/node/.n8n/`
