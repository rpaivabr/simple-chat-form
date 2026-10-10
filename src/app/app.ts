import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para funcionalidades básicas
import { Chat, GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = '<COLE_SUA_API_KEY_AQUI>';
const SYSTEM_PROMPT = `Você é o assistente virtual do Chat-Form. Sua única função é coletar 3 dados do usuário para o cadastro de forma acolhedora, concisa e sequencial:
1. Nome
2. E-mail
3. Tamanho da camiseta (apenas: P, M ou G)

Diretrizes de conversação:
- Peça UM dado por vez. Nunca peça dois dados na mesma mensagem.
- Seja breve, cordial e gentil. Use no máximo 1 ou 2 frases curtas por resposta.
- Validação:
  * Nome: Aceite qualquer nome válido informado.
  * E-mail: Verifique se contém formato plausível (ex: algo@dominio.ext). Se inválido, aponte gentilmente e peça para digitar de novo.
  * Tamanho da camiseta: O usuário deve escolher exclusivamente entre P, M ou G. Se disser algo diferente, explique com simpatia que temos apenas P, M ou G disponíveis e peça para escolher um deles.
- Encerramento Obrigatório:
  * Imediatamente após o usuário informar um tamanho válido (P, M ou G) e os 3 dados estiverem coletados, você NÃO DEVE enviar nenhuma mensagem de texto de despedida, agradecimento ou introdução.
  * Sua resposta final DEVE SER RIGOROSAMENTE apenas o objeto JSON plano sem blocos de código markdown ou texto ao redor, no formato:
  {"nome": "<nome_coletado>", "email": "<email_coletado>", "tamanho": "<P|M|G>"}`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .container { max-width: 600px; margin: 40px auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .chat-container { border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .chat-history { height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px; }
    
    .msg-bubble { padding: 12px 16px; border-radius: 16px; max-width: 80%; line-height: 1.4; word-wrap: break-word; }
    .msg-user { align-self: flex-end; background-color: #6366f1; color: white; border-bottom-right-radius: 4px; }
    .msg-model { align-self: flex-start; background-color: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px; }
    
    .input-area { display: flex; gap: 10px; border-top: 1px solid #e0e0e0; padding-top: 15px; }
    input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #6366f1; }
    
    button { padding: 12px 24px; cursor: pointer; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; transition: background 0.2s; }
    button:hover:not(:disabled) { background: #4f46e5; }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    
    .success-card { background: #ecfdf5; color: #065f46; padding: 30px; border-radius: 12px; border: 1px solid #a7f3d0; text-align: center; }
    .success-data { text-align: left; background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #a7f3d0; }
    .btn-start { display: block; margin: 0 auto; padding: 15px 40px; font-size: 1.1rem; border-radius: 30px; }
    .typing { color: #6b7280; font-size: 0.9rem; margin-top: 5px; font-style: italic; }
  `],
  template: `
    <!-- PARTE 1 -->
    <!-- <div>
      <input 
        type="text" 
        [value]="userMessage()"
        (input)="userMessage.set($event.target.value)" 
        (keyup.enter)="ask()"
        placeholder="Digite sua pergunta..." 
      />
      <button (click)="ask()">Enviar</button>
      <p>{{ response() }}</p>
    </div> -->
    

    <!-- PARTE 2 -->
    <!--
    <div class="container">
      @if (isFinished()) {
        <div class="success-card">
          <h2>✅ Cadastro Realizado com Sucesso!</h2>
          <p>O assistente concluiu a coleta e seus dados foram validados.</p>
          
          <div class="success-data">
            <p><strong>Nome:</strong> {{ finalData()?.nome }}</p>
            <p><strong>E-mail:</strong> {{ finalData()?.email }}</p>
            <p><strong>Camiseta:</strong> {{ finalData()?.tamanho }}</p>
          </div>
          
          <button (click)="resetApp()" style="margin-top: 25px;">Fazer novo cadastro</button>
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
            <button 
              (click)="handleSend()" 
              [disabled]="userMessage().trim() === '' || isLoading()">
              Enviar
            </button>
          </div>
        </div>
      } 
      
      @else {
        <div style="text-align: center;">
          <h1 style="margin-bottom: 30px; color: #1f2937;">Credenciamento Inteligente</h1>
          <button class="btn-start" (click)="initChat()">Iniciar Cadastro via Chat</button>
        </div>
      }
    </div>
    -->
  `,
})
export class App {
  /* Parte 1 */
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  private response = signal('');
  userMessage = signal<string>('');

  async ask() {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: this.userMessage(),
    });

    this.response.set(response.text ?? '');
    this.userMessage.set('');
  }

  /* Parte 2 */
  /*private chatSession: Chat | null = null;

  async askChat() {
    if (!this.chatSession) {
      this.chatSession = this.ai.chats.create({
        model: "gemini-3.1-flash-lite",
      });
    }
    const chatResponse = await this.chatSession.sendMessage({
      message: this.userMessage(),
    });

    this.response.set(chatResponse.text ?? '');
    this.userMessage.set('');
  }
  */

  /* PARTE 3 */
  /*
  // Gerenciamento de Estado usando Signals (Reatividade moderna)
  chatInProgress = signal<boolean>(false);
  isFinished = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  messages = signal<{ role: 'user' | 'model', text: string }[]>([]);
  finalData = signal<any>(null);

  // Método para ler o input do usuário na tela
  onInputChange(event: Event) {
    const element = event.target as HTMLInputElement;
    this.userMessage.set(element.value);
  }

  async initChat() {
    this.chatInProgress.set(true);
    this.isLoading.set(true);

    this.chatSession = this.ai.chats.create({
      model: 'gemini-3.1-flash-lite',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    // Puxa a primeira interação para a IA se apresentar
    try {
      const response = await this.chatSession.sendMessage({ message: 'Olá, pode começar o cadastro.' });
      this.messages.update(history => [...history, { role: 'model', text: response.text ?? '' }]);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSend() {
    const text = this.userMessage().trim();
    if (!text || !this.chatSession) return;

    // 1. Joga a mensagem do usuário na tela e limpa o campo
    this.messages.update(history => [...history, { role: 'user', text }]);
    this.userMessage.set('');
    this.isLoading.set(true);

    try {
      // 2. Envia para o Gemini
      const response = await this.chatSession.sendMessage({ message: text });
      const modelResponseText = response.text ?? '';

      // 3. Verifica se a IA gerou o JSON final
      if (modelResponseText.includes('{') && modelResponseText.includes('}')) {
        // Extrai apenas o JSON no meio da string (caso o modelo coloque marcações Markdown)
        const jsonString = modelResponseText.substring(
          modelResponseText.indexOf('{'),
          modelResponseText.lastIndexOf('}') + 1
        );

        const parsedData = JSON.parse(jsonString);

        // Finaliza o chat e mostra o cartão de sucesso
        this.finalData.set(parsedData);
        this.isFinished.set(true);
      } else {
        // Se for conversa normal, exibe a mensagem na tela
        this.messages.update(history => [...history, { role: 'model', text: modelResponseText }]);
      }
    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      this.messages.update(history => [...history, { role: 'model', text: 'Tive um pequeno erro de conexão, pode repetir?' }]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Reseta o estado inteiro para reiniciar a demonstração
  resetApp() {
    this.chatInProgress.set(false);
    this.isFinished.set(false);
    this.messages.set([]);
    this.finalData.set(null);
    this.chatSession = null;
  }
  */
}