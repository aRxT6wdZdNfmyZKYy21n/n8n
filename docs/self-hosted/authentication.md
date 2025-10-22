# Аутентификация в n8n Self-Hosted Edition

## 🔐 Методы аутентификации

n8n Self-Hosted Edition поддерживает несколько методов аутентификации:

- **Email/Password** - базовая аутентификация
- **LDAP** - интеграция с Active Directory
- **SAML** - единый вход (SSO)
- **OAuth** - интеграция с внешними провайдерами
- **API Keys** - программный доступ

## 📧 Email/Password аутентификация

### Настройка

Email/Password аутентификация включена по умолчанию и не требует дополнительной настройки.

### Создание пользователей

1. **Первый пользователь (администратор):**
   - Откройте n8n в браузере
   - Заполните форму регистрации
   - Первый пользователь автоматически получает права администратора

2. **Дополнительные пользователи:**
   - Войдите как администратор
   - Перейдите в **Settings > Users**
   - Нажмите **Add User**
   - Заполните данные пользователя

### Роли пользователей

- **Owner** - полный доступ ко всем функциям
- **Admin** - административные права
- **Editor** - может создавать и редактировать workflow
- **Viewer** - только просмотр

## 🔗 LDAP аутентификация

### Настройка LDAP

1. **Перейдите в Settings > Authentication**
2. **Выберите LDAP**
3. **Настройте параметры:**

```env
# Переменные окружения для LDAP
LDAP_HOST=ldap://your-ldap-server.com
LDAP_PORT=389
LDAP_BIND_DN=cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD=your_password
LDAP_BASE_DN=dc=company,dc=com
LDAP_USER_FILTER=(uid={{username}})
LDAP_USER_ATTRIBUTES=uid,cn,mail,displayName
LDAP_GROUP_FILTER=(member={{dn}})
LDAP_GROUP_ATTRIBUTES=cn,description
```

### Пример конфигурации LDAP

```yaml
# Настройки LDAP для Active Directory
LDAP_HOST: ldap://ad.company.com
LDAP_PORT: 389
LDAP_BIND_DN: CN=Service Account,OU=Service Accounts,DC=company,DC=com
LDAP_BIND_PASSWORD: service_account_password
LDAP_BASE_DN: DC=company,DC=com
LDAP_USER_FILTER: (sAMAccountName={{username}})
LDAP_USER_ATTRIBUTES: sAMAccountName,cn,mail,displayName,memberOf
LDAP_GROUP_FILTER: (member={{dn}})
LDAP_GROUP_ATTRIBUTES: cn,description
```

### Тестирование LDAP

```bash
# Тест подключения к LDAP серверу
ldapsearch -H ldap://your-ldap-server.com -D "cn=admin,dc=company,dc=com" -w your_password -b "dc=company,dc=com" "(objectClass=*)"
```

## 🎫 SAML аутентификация

### Настройка SAML

1. **Перейдите в Settings > Authentication**
2. **Выберите SAML**
3. **Настройте параметры:**

```env
# Переменные окружения для SAML
SAML_ENTITY_ID=https://your-n8n-instance.com
SAML_SSO_URL=https://your-saml-provider.com/sso
SAML_CERTIFICATE=-----BEGIN CERTIFICATE-----
your_certificate_here
-----END CERTIFICATE-----
SAML_SIGNATURE_ALGORITHM=rsa-sha256
SAML_DIGEST_ALGORITHM=sha256
SAML_NAME_ID_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
SAML_ATTRIBUTE_MAPPING={"email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"}
```

### Пример конфигурации SAML

```yaml
# Настройки SAML для Azure AD
SAML_ENTITY_ID: https://your-n8n-instance.com
SAML_SSO_URL: https://login.microsoftonline.com/your-tenant-id/saml2
SAML_CERTIFICATE: |
  -----BEGIN CERTIFICATE-----
  MIIC...your_certificate_here...
  -----END CERTIFICATE-----
SAML_SIGNATURE_ALGORITHM: rsa-sha256
SAML_DIGEST_ALGORITHM: sha256
SAML_NAME_ID_FORMAT: urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
SAML_ATTRIBUTE_MAPPING: |
  {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
  }
```

## 🔑 OAuth аутентификация

### Поддерживаемые провайдеры

- Google
- GitHub
- Microsoft
- GitLab
- И другие

### Настройка OAuth

1. **Создайте приложение у провайдера**
2. **Получите Client ID и Client Secret**
3. **Настройте redirect URI:**
   ```
   http://your-n8n-instance.com/rest/oauth2-credential/callback
   ```

### Пример конфигурации Google OAuth

```env
# Переменные окружения для Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://your-n8n-instance.com/rest/oauth2-credential/callback
```

## 🔑 API Keys

### Создание API Key

1. **Войдите как администратор**
2. **Перейдите в Settings > API Keys**
3. **Нажмите Create API Key**
4. **Укажите имя и права доступа**
5. **Сохраните ключ (он показывается только один раз)**

### Использование API Key

```bash
# Пример использования API Key
curl -H "X-N8N-API-KEY: your_api_key" \
     -H "Content-Type: application/json" \
     http://localhost:5678/api/v1/workflows
```

## 🔒 Настройки безопасности

### Сессии

```env
# Настройки сессий
N8N_SESSION_LIFETIME=168  # часы (7 дней)
N8N_SESSION_COOKIE_SECURE=true
N8N_SESSION_COOKIE_SAME_SITE=strict
N8N_SESSION_COOKIE_HTTP_ONLY=true
```

### JWT токены

```env
# Настройки JWT
N8N_JWT_SECRET=your_jwt_secret_here
N8N_JWT_EXPIRATION_TIME=7d
```

### Шифрование

```env
# Ключ шифрования
N8N_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

## 👥 Управление пользователями

### Создание пользователя

```bash
# Через API
curl -X POST http://localhost:5678/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: your_api_key" \
  -d '{
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "editor"
  }'
```

### Изменение роли пользователя

```bash
# Через API
curl -X PATCH http://localhost:5678/api/v1/users/user-id \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: your_api_key" \
  -d '{
    "role": "admin"
  }'
```

### Удаление пользователя

```bash
# Через API
curl -X DELETE http://localhost:5678/api/v1/users/user-id \
  -H "X-N8N-API-KEY: your_api_key"
```

## 🔍 Проверка аутентификации

### Проверка LDAP подключения

```bash
# Тест подключения
ldapsearch -H ldap://your-ldap-server.com \
  -D "cn=admin,dc=company,dc=com" \
  -w your_password \
  -b "dc=company,dc=com" \
  "(uid=testuser)"
```

### Проверка SAML конфигурации

```bash
# Проверка метаданных SAML
curl -X GET https://your-saml-provider.com/metadata
```

### Проверка OAuth

```bash
# Тест OAuth callback
curl -X GET "http://localhost:5678/rest/oauth2-credential/callback?code=test_code"
```

## 🚨 Устранение неполадок

### Проблемы с LDAP

1. **Проверьте подключение к LDAP серверу**
2. **Убедитесь в правильности DN и пароля**
3. **Проверьте фильтры пользователей и групп**

### Проблемы с SAML

1. **Проверьте сертификат SAML провайдера**
2. **Убедитесь в правильности Entity ID**
3. **Проверьте настройки атрибутов**

### Проблемы с OAuth

1. **Проверьте Client ID и Client Secret**
2. **Убедитесь в правильности redirect URI**
3. **Проверьте настройки приложения у провайдера**

### Общие проблемы

1. **Проверьте логи приложения**
2. **Убедитесь в правильности переменных окружения**
3. **Проверьте права доступа к файлам конфигурации**

## 📋 Примеры конфигураций

### Полная конфигурация LDAP

```env
# LDAP настройки
LDAP_HOST=ldap://ad.company.com
LDAP_PORT=389
LDAP_BIND_DN=CN=Service Account,OU=Service Accounts,DC=company,DC=com
LDAP_BIND_PASSWORD=service_account_password
LDAP_BASE_DN=DC=company,DC=com
LDAP_USER_FILTER=(sAMAccountName={{username}})
LDAP_USER_ATTRIBUTES=sAMAccountName,cn,mail,displayName,memberOf
LDAP_GROUP_FILTER=(member={{dn}})
LDAP_GROUP_ATTRIBUTES=cn,description
LDAP_TLS_ENABLED=false
LDAP_TLS_REJECT_UNAUTHORIZED=true
```

### Полная конфигурация SAML

```env
# SAML настройки
SAML_ENTITY_ID=https://n8n.company.com
SAML_SSO_URL=https://login.microsoftonline.com/tenant-id/saml2
SAML_CERTIFICATE=-----BEGIN CERTIFICATE-----
MIIC...certificate_here...
-----END CERTIFICATE-----
SAML_SIGNATURE_ALGORITHM=rsa-sha256
SAML_DIGEST_ALGORITHM=sha256
SAML_NAME_ID_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
SAML_ATTRIBUTE_MAPPING={"email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"}
SAML_WANT_ASSERTIONS_SIGNED=true
SAML_WANT_RESPONSE_SIGNED=true
SAML_WANT_ATTRIBUTE_STATEMENT=true
```
