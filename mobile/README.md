# Stocko Mobile

Base mobile em Expo/React Native para Android (Play Store) e iOS (App Store).

## Setup

1. Instalar dependências:
   - `npm install`
2. Criar variáveis de ambiente:
   - copiar `.env.example` para `.env`
3. Arrancar app:
   - `npm run android` ou `npm run start`

## Variáveis de ambiente

- `EXPO_PUBLIC_API_URL`: URL da API backend (`http://localhost:5130` em desenvolvimento local).

## Próximos passos para publicação

1. Autenticação mobile com Supabase.
2. Navegação por tabs/screens.
3. Configurar EAS Build (`eas.json`) para AAB e IPA.
4. Preparar ícones, splash, policy URL e metadados de store.
