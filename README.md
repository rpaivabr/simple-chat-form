# Simple Chat-Form (Angular + Gemini API)

Este repositório contém o material prático do workshop de integração entre Angular moderno (v18+) e a API do Google Gemini. O objetivo é transformar formulários longos e tediosos em uma experiência de bate-papo fluida, validando dados e extraindo um JSON final estruturado.

**🚀 Teste o aplicativo rodando:** [Insira o link do seu deploy aqui]

## Pré-requisitos

Antes de começar, você precisará de uma chave da API do Gemini.

1. Acesse o [Google AI Studio](https://aistudio.google.com/).
2. Faça login com sua conta Google.
3. Clique em **Get API Key** e crie uma nova chave.
4. Copie a chave e substitua `<COLE_SUA_API_KEY_AQUI>` no código.

---

## Passo 1: O Básico da API (Interação Única)

Nesta primeira etapa, vamos conectar a API do Gemini de forma simples. Fazemos uma pergunta, e a IA nos dá uma resposta (sem contexto de histórico). Vamos explorar os **Signals** para gerenciar o estado da tela e o **Property/Event Binding** do Angular.

**Template (HTML):**

```html
<div>
  <input 
    type="text" 
    [value]="userMessage()"
    (input)="userMessage.set($event.target.value)" 
    (keyup.enter)="ask()"
    placeholder="Digite sua pergunta..." 
  />
  <button (click)="ask()">Enviar</button>
  <p>{{ response() }}</p>
</div>

```

**Lógica (TypeScript):**

```typescript
import { Component, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = '<COLE_SUA_API_KEY_AQUI>';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `...cole o template aqui...`,
})
export class App {
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  response = signal('');
  userMessage = signal<string>('');

  async ask() {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: this.userMessage(),
    });

    this.response.set(response.text ?? '');
    this.userMessage.set('');
  }
}

```

---

## Passo 2: Adicionando Memória (Modo Chat)

Um assistente virtual precisa lembrar do que você acabou de falar. Em vez de usar `generateContent`, passamos a usar `chats.create`, que gerencia automaticamente o histórico da conversa.

**Lógica (TypeScript - Substitua o método ask):**

```typescript
import { Chat } from '@google/genai';

export class App {
  // ... (variáveis anteriores)
  private chatSession: Chat | null = null;

  async askChat() {
    // Inicia a sessão de chat apenas na primeira vez
    if (!this.chatSession) {
      this.chatSession = this.ai.chats.create({
        model: "gemini-3.1-flash-lite",
      });
    }
    
    // Envia a mensagem preservando o histórico
    const chatResponse = await this.chatSession.sendMessage({
      message: this.userMessage(),
    });

    this.response.set(chatResponse.text ?? '');
    this.userMessage.set('');
  }
}

```

---

## Passo 3: O Produto Final (Validação e Extração de JSON)

Agora unimos tudo. Adicionamos uma interface completa de chat, controle de estado com o novo Control Flow do Angular (`@if`, `@for`) e um **System Prompt** rigoroso. A IA assume o papel de coletora de dados e, no fim, extraímos a resposta em formato JSON para usar no nosso sistema.

**Template Principal (HTML):**

```html
<div class="container">
  @if (isFinished()) {
    <div class="success-card">
      <h2>✅ Cadastro Realizado com Sucesso!</h2>
      <div class="success-data">
        <p><strong>Nome:</strong> {{ finalData()?.nome }}</p>
        <p><strong>E-mail:</strong> {{ finalData()?.email }}</p>
        <p><strong>Camiseta:</strong> {{ finalData()?.tamanho }}</p>
      </div>
      <button (click)="resetApp()">Fazer novo cadastro</button>
    </div>
  } 
  @else if (chatInProgress()) {
    <div class="chat-container">
      <div class="chat-history">
        @for (msg of messages(); track $index) {
          <div class="msg-bubble" 
               [class.msg-user]="msg.role === 'user'" 
               [class.msg-model]="msg.role === 'model'">
            {{ msg.text }}
          </div>
        }
        @if (isLoading()) {
          <div class="typing">O assistente está digitando...</div>
        }
      </div>
      <div class="input-area">
        <input 
          type="text" 
          [value]="userMessage()" 
          (input)="onInputChange($event)"
          (keyup.enter)="handleSend()"
          placeholder="Digite sua resposta..." 
          [disabled]="isLoading()"
        />
        <button (click)="handleSend()" [disabled]="userMessage().trim() === '' || isLoading()">
          Enviar
        </button>
      </div>
    </div>
  } 
  @else {
    <div style="text-align: center;">
      <button class="btn-start" (click)="initChat()">Iniciar Cadastro via Chat</button>
    </div>
  }
</div>

```

**Lógica (TypeScript Completo):**
*(Consulte o arquivo `app.ts` final neste repositório para ver a estrutura completa com as diretrizes do System Prompt, o método `handleSend` que intercepta o JSON e os estilos CSS.)*

---

## Desafio Extra: Vibe Coding com Agentes Autônomos

Para acelerar o processo de engenharia, podemos orquestrar Agentes de IA para atuar como PM, UX e Desenvolvedor. O fluxo a seguir é projetado para o **Google Antigravity** e baseia-se nas técnicas exploradas neste [Codelab Oficial do Google](https://codelabs.developers.google.com/codelabs/coding-jam/instructions?hl=pt-br#0).

Siga os prompts abaixo, um por vez, em seu workspace do Antigravity:

**Prompt 1: Setup do Ambiente**

```text
Please install the workshop skills into this workspace's .agents/skills/ folder. 
Run these commands from the project root:

1. git clone https://github.com/gca-americas/skills-garden .agents/skills/skills-garden
2. git clone https://github.com/google-gemini/gemini-skills .agents/skills/gemini-skills
3. npx skills add https://github.com/angular/skills

When Antigravity asks permission to run each command, I'll click Allow.
When done, list the skills that are now available in this workspace.

```

**Prompt 2: Refinamento de Escopo**
*(Crie um arquivo `@BRIEF.md` com a sua ideia básica antes de rodar este prompt)*

```text
Here's what's in @BRIEF.md. Before we lock the spec, ask me 3 short 
questions to refine it:
1. What's the one input I want the user to provide?
2. What's the magical moment for the user?
3. What are we deliberately NOT building (to keep scope tight)?

DO NOT generate any plans, docs, or code yet. Just ask me the questions 
and wait for my answers.

DO NOT NEED TO WRITE implementation plan.

```

**Prompt 3: Geração de Documentos de Design (PM, UX, Eng)**

```text
Apply all three design-doc skills in this order:

1. pm-design-doc from .agents/skills/skills-garden/design-doc-skills/pm-design-doc/
   → Generates product.md

2. ux-design-doc from .agents/skills/skills-garden/design-doc-skills/ux-design-doc/
   → Generates ui.md (based on the product.md you just created)

3. eng-design-doc from .agents/skills/skills-garden/design-doc-skills/eng-design-doc/
   → Generates engineering.md (based on product.md, ui.md, and @BRIEF.md)
   → MUST include a "Testing strategy" section with real content
     (specific functions to unit-test, one integration test per major flow,
     and what's deliberately NOT being tested)

Use the patterns in @reference/ as guidance for the engineering doc 
(but vary if the brief justifies it).

Save all three files in the project root. After each one is saved, 
briefly confirm what you saved before moving to the next.

When all three are done, give me a final summary listing the section 
titles in each file.

DO NOT NEED TO WRITE implementation plan. ONLY show me all three generated files and a final summary

```

**Prompt 4: Implementação e Testes Automatizados**

```text
You're going to do two things in one shot.

PART 1 — IMPLEMENT THE APP CODE
- Build it according to @engineering.md (stack, file structure)
- Match the UI described in @ui.md
- Use the patterns in @reference/ as guidance for code style
- Backend: use Python with `uv` for dependency management
- If your chosen stack requires Node.js and it isn't installed on my 
  system, install it via Antigravity (use brew/winget/apt) — ask 
  permission first
- DO NOT start any dev servers — that's a later section

PART 2 — APPLY THE TEST-GATE SKILL
After the code is written, apply the test-driven-dev skill from
.agents/skills/skills-garden/eng-skills/test-driven-dev.md.

Use the "Testing strategy" section in @engineering.md as the test plan.

IMPORTANT: Mock the Gemini API calls in tests — use a stub that returns
fake response data. The real API key isn't set up yet, and tests should
be deterministic and free anyway (best practice).

The skill should:
1. Write the tests described in the Testing strategy
2. Run them (use pytest for Python, Vitest or Jest for JS)
3. If any fail, fix the CODE (not the tests) and re-run
4. Up to 3 retry attempts max
5. If still failing after 3 tries, STOP and tell me what's broken

When Antigravity asks permission to run commands (uv sync, uv pip 
install, pytest, etc.), click Allow.

Report results when both parts are done.

```