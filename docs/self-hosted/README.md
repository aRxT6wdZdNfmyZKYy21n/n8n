# n8n Self-Hosted Edition

Добро пожаловать в n8n Self-Hosted Edition - полностью автономную версию n8n без внешних зависимостей.

## 🚀 Особенности Self-Hosted Edition

### ✅ Все Enterprise функции включены
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

## 📋 Системные требования

- **Node.js**: 18.10 или выше
- **База данных**: PostgreSQL, MySQL, SQLite, или MariaDB
- **Память**: минимум 2GB RAM
- **Диск**: минимум 1GB свободного места

## 🐳 Развертывание с Docker

### Быстрый старт

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd n8n-self-hosted

# Запустите с Docker Compose
docker-compose up -d
```

### Конфигурация

Создайте файл `.env`:

```env
# База данных
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_password

# n8n настройки
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/

# Безопасность
N8N_ENCRYPTION_KEY=your_encryption_key
```

## 🔧 Настройка аутентификации

### LDAP

1. Перейдите в **Settings > Authentication**
2. Выберите **LDAP**
3. Настройте параметры подключения:

```yaml
LDAP_HOST: ldap://your-ldap-server.com
LDAP_PORT: 389
LDAP_BIND_DN: cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD: your_password
LDAP_BASE_DN: dc=company,dc=com
LDAP_USER_FILTER: (uid={{username}})
```

### SAML

1. Перейдите в **Settings > Authentication**
2. Выберите **SAML**
3. Настройте параметры SAML провайдера

## 📚 Локальная документация

Вся документация доступна локально в папке `docs/self-hosted/`:

- [Установка и настройка](installation.md)
- [Конфигурация](configuration.md)
- [Аутентификация](authentication.md)
- [API Reference](api.md)
- [Troubleshooting](troubleshooting.md)

## 🆘 Поддержка

Для получения помощи:

1. Проверьте [Troubleshooting](troubleshooting.md)
2. Изучите логи приложения
3. Обратитесь к администратору системы

## 📄 Лицензия

Эта версия n8n модифицирована для self-hosted использования. Все Enterprise функции включены по умолчанию.

---

**Версия**: Self-Hosted Edition  
**Дата**: $(date)  
**Статус**: Все Enterprise функции активны
