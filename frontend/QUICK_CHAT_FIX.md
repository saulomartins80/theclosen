# 🔧 Correção Rápida - Problemas de Contraste no Chat

## Problemas:
1. Texto "Nova Conversa" e "Modo Básico" claros demais no modo claro
2. Texto das mensagens do chat claro demais no modo claro  
3. Duas linhas horizontais dividindo o chat

## Solução Rápida:

### 1. Abrir o arquivo: `frontend/components/ChatbotCorrected.tsx`

### 2. Encontrar o header do chat (linha ~1100) e substituir por:

```tsx
<header className={`${theme.headerBg} p-4 chat-border-bottom flex justify-between items-center`}>
  <div>
    <h3 className="font-bold chat-title">{activeSession.title}</h3>
    <p className="text-xs chat-subtitle">
      {isPremiumUser ? (
        <span className="flex items-center gap-1">
          <Sparkles size={12} /> {getPlanDisplayName()}
        </span>
      ) : 'Modo Básico'}
    </p>
  </div>
  <button
    onClick={() => setActiveSession(null)}
    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
  >
    <X size={18} />
  </button>
</header>
```

### 3. Encontrar o footer do chat (linha ~1200) e substituir por:

```tsx
<div className={`p-4 chat-border-top ${theme.headerBg}`}>
  <CommandBar 
    onSubmit={handleSendMessage}
    isLoading={isLoading}
    theme={theme}
    placeholder={isPremiumUser 
      ? "Digite sua pergunta ou ação financeira..." 
      : "Pergunte sobre finanças ou o app..."}
  />
</div>
```

### 4. Encontrar as mensagens do bot (linha ~300) e adicionar a classe:

```tsx
<div className={`p-3 rounded-lg ${theme.bubbleBot} shadow-sm`}>
  <div className="chat-message-content">
    {typeof message.content === 'string' ? message.content : message.content}
  </div>
</div>
```

## CSS já aplicado no globals.css:
✅ Todas as classes necessárias já estão no arquivo CSS

## Resultado:
- Texto "Nova Conversa" e "Modo Básico" ficarão escuros e visíveis no modo claro
- Texto das mensagens ficará escuro e visível no modo claro
- As bordas divisórias ficarão visíveis em ambos os modos

## Teste:
1. Aplicar as mudanças
2. Testar no modo claro e escuro
3. Verificar se o contraste está adequado 