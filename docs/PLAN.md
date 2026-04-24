# 🎼 PLANO DE ORQUESTRAÇÃO: Códigos de Recuperação 2FA

Implementação de códigos de recuperação de uso único para o sistema de Autenticação de Dois Fatores (2FA), garantindo que o Super Admin possa recuperar o acesso à sua conta caso perca o dispositivo com o aplicativo de autenticação.

## 🛠️ Proposed Changes

### 1. `database-architect` & `backend-specialist`

#### [MODIFY] `backend/prisma/schema.prisma`
- Adicionar o campo `twoFactorRecoveryCodes String[] @default([])` ao model `User`.

#### [MODIFY] `backend/src/auth/auth.service.ts`
- **Geração**: Criar uma função para gerar 10 códigos alfanuméricos aleatórios (ex: 8-10 caracteres).
- **Hashing**: Armazenar os códigos com hash (argon2) no banco de dados.
- **Login**: Alterar o método `authenticate2fa` para aceitar tanto o código TOTP quanto um código de recuperação.
- **Consumo**: Se um código de recuperação for usado, ele deve ser removido da lista do usuário.

---

### 2. `frontend-specialist`

#### [MODIFY] `frontend/src/app/(admin)/admin/profile/page.tsx`
- **Exibição**: Após o sucesso da ativação do 2FA, mostrar um modal ou seção com os códigos de recuperação.
- **Download**: Adicionar botão para baixar os códigos em um arquivo `.txt` ou copiar para o clipboard.
- **Gestão**: Adicionar opção para "Gerar novos códigos de backup" (invalidando os anteriores).

#### [MODIFY] `frontend/src/app/(public)/auth/login/page.tsx`
- **Interface**: Adicionar um link "Usar código de recuperação" na tela de desafio 2FA.
- **Input**: Permitir a entrada de um código de recuperação no mesmo campo ou em um campo dedicado.

---

### 3. `test-engineer`
- **Unit Tests**: Validar que códigos de recuperação são invalidados após o primeiro uso.
- **Security Check**: Garantir que os códigos originais nunca sejam armazenados em texto puro.

---

## 🧪 Verification Plan

1. **Ativação**: Habilitar 2FA e salvar os códigos.
2. **Login Normal**: Entrar usando o PIN do Google Authenticator (Sucesso).
3. **Login Recuperação**: Entrar usando um dos códigos de backup salvos (Sucesso).
4. **Reuso**: Tentar usar o mesmo código de backup novamente (Erro).
5. **Novo Geramento**: Gerar novos códigos no perfil e tentar usar um código antigo (Erro).
