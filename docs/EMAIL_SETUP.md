# Configuração de E-mail Local (MailHog)

Este guia explica como utilizar o serviço de e-mail local no ambiente de desenvolvimento do EventHub.

## 🚀 Como Funciona
Utilizamos o **MailHog**, um serviço que atua como um servidor SMTP falso. Ele captura todos os e-mails enviados pelo sistema em vez de enviá-los para destinatários reais, permitindo que você visualize o conteúdo e o layout dos e-mails em uma interface web.

## 🛠️ Instalação
O MailHog já está configurado no `docker-compose.yml`. Para iniciá-lo:

```bash
docker compose up -d mailhog
```

## 🌐 Acesso à Interface (UI)
Após iniciar o container, você pode acessar a interface web para visualizar os e-mails capturados:

- **URL:** [http://localhost:8025](http://localhost:8025)

## ⚙️ Configurações no Backend
As variáveis de ambiente padrão no `.env` já estão configuradas para o MailHog:

```env
SMTP_HOST="localhost"
SMTP_PORT="1025"
MAIL_FROM="noreply@eventhub.local"
```

> [!IMPORTANT]
> A porta **1025** é usada para recepção de e-mails (SMTP).
> A porta **8025** é usada para a interface web (HTTP).

## 🧪 Testando
Para garantir que a integração está funcionando, você pode rodar os testes dedicados:

```bash
npm run test:e2e -- test/mail.e2e-spec.ts
```
