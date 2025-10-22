# n8n Self-Hosted Edition

🚀 **Полностью автономная версия n8n с всеми Enterprise функциями**

n8n Self-Hosted Edition - это модифицированная версия n8n, которая полностью отвязана от внешних серверов и включает все Enterprise функции по умолчанию.

## ✨ Особенности

### 🔓 Все Enterprise функции включены
- **LDAP/SAML аутентификация** - интеграция с корпоративными системами
- **Workflow History** - полная история выполнения workflow
- **Source Control** - управление версиями workflow
- **External Secrets** - интеграция с внешними системами секретов
- **Advanced Permissions** - расширенная система прав доступа
- **AI Assistant & Ask AI** - искусственный интеллект для помощи
- **Variables Management** - управление переменными
- **Folders** - организация workflow в папки
- **Multi-main instances** - поддержка множественных экземпляров
- **Worker View** - просмотр worker процессов
- **И многие другие Enterprise функции**

### 🔒 Полная приватность
- **Никакой телеметрии** - все данные остаются на вашем сервере
- **Никаких внешних обращений** - полная автономность
- **Локальная документация** - вся помощь доступна локально

### 🚫 Отключенные функции
- **Community Nodes** - установка внешних пакетов отключена
- **Проверка обновлений** - автоматическая проверка версий отключена
- **Внешние шаблоны** - используются только встроенные шаблоны

## 🚀 Быстрый старт

### Предварительные требования
- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- Минимум 1GB свободного места на диске

### Установка за 5 минут

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd n8n-self-hosted

# Настройте конфигурацию
cp env.example .env
# Отредактируйте .env файл (ОБЯЗАТЕЛЬНО измените ключи безопасности!)

# Запустите приложение
docker-compose -f docker-compose.self-hosted.yml up -d

# Откройте n8n в браузере
open http://localhost:5678
```

## 📋 Системные требования

### Минимальные требования
- **CPU**: 2 ядра
- **RAM**: 2GB
- **Диск**: 1GB свободного места
- **ОС**: Linux, macOS, Windows

### Рекомендуемые требования
- **CPU**: 4+ ядра
- **RAM**: 8GB+
- **Диск**: 10GB+ SSD
- **ОС**: Linux (Ubuntu 20.04+, CentOS 8+)

## 🗄️ Поддерживаемые базы данных

- **PostgreSQL** (рекомендуется)
- **MySQL** 8.0+
- **SQLite** (для тестирования)
- **MariaDB** 10.3+

## 🔐 Методы аутентификации

- **Email/Password** - базовая аутентификация
- **LDAP** - интеграция с Active Directory
- **SAML** - единый вход (SSO)
- **OAuth** - интеграция с внешними провайдерами
- **API Keys** - программный доступ

## 📚 Документация

Вся документация доступна локально в папке `docs/self-hosted/`:

- [📖 Основная документация](docs/self-hosted/README.md)
- [🚀 Установка](docs/self-hosted/installation.md)
- [⚙️ Конфигурация](docs/self-hosted/configuration.md)
- [🔐 Аутентификация](docs/self-hosted/authentication.md)
- [🐳 Развертывание](docs/self-hosted/deployment.md)

## 🐳 Docker развертывание

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

## 🔍 Проверка установки

### Проверка статуса

```bash
# Docker
docker-compose -f docker-compose.self-hosted.yml ps

# Без Docker
curl http://localhost:5678/healthz
```

### Проверка логов

```bash
# Docker
docker-compose -f docker-compose.self-hosted.yml logs -f n8n

# Без Docker
tail -f /var/log/n8n/n8n.log
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

## 📄 Лицензия

Эта версия n8n модифицирована для self-hosted использования. Все Enterprise функции включены по умолчанию.

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с нашими рекомендациями по внесению изменений.

## 📞 Контакты

- **Документация**: `/docs/self-hosted/`
- **Логи**: `/var/log/n8n/`
- **Конфигурация**: `.env`
- **Данные**: `/home/node/.n8n/`

---

**Версия**: Self-Hosted Edition  
**Статус**: Все Enterprise функции активны  
**Лицензия**: Self-Hosted Edition
