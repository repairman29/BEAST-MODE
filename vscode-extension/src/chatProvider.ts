import * as vscode from 'vscode';
import { BeastModeClient } from './beastModeClient';

export class ChatProvider {
  private client: BeastModeClient;
  private panel: vscode.WebviewPanel | undefined;

  constructor(client: BeastModeClient) {
    this.client = client;
  }

  showChat() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'beastModeChat',
      'BEAST MODE Chat',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getChatHtml();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendMessage') {
        const editor = vscode.window.activeTextEditor;
        const repo = editor ? this.getRepoFromPath(editor.document.fileName) : 'user/repo';
        const currentFile = editor?.document.fileName;

        const result = await this.client.chat(message.text, repo, currentFile);

        if (result.success) {
          this.panel?.webview.postMessage({
            command: 'receiveMessage',
            message: result.message,
            code: result.code,
            files: result.files,
            suggestions: result.suggestions,
          });
        } else {
          this.panel?.webview.postMessage({
            command: 'error',
            error: result.error,
          });
        }
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private getRepoFromPath(filePath: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return `user/${workspaceFolder.name}`;
    }
    return 'user/repo';
  }

  private getChatHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: system-ui;
            padding: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
            margin: 0;
          }
          .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
          }
          .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
          }
          .user-message {
            background: #0066cc;
            text-align: right;
          }
          .assistant-message {
            background: #2d2d2d;
          }
          .input-container {
            display: flex;
            padding: 20px;
            border-top: 1px solid #3e3e3e;
          }
          input {
            flex: 1;
            padding: 10px;
            background: #2d2d2d;
            border: 1px solid #3e3e3e;
            color: #d4d4d4;
            border-radius: 5px;
            margin-right: 10px;
          }
          button {
            padding: 10px 20px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          button:hover {
            background: #0052a3;
          }
          code {
            background: #1e1e1e;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
        </style>
      </head>
      <body>
        <div class="chat-container">
          <div class="messages" id="messages">
            <div class="message assistant-message">
              <p>Hello! I'm BEAST MODE. Ask me about your codebase, generate code, or get help.</p>
            </div>
          </div>
          <div class="input-container">
            <input type="text" id="input" placeholder="Ask about your codebase..." />
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          const messagesDiv = document.getElementById('messages');
          const input = document.getElementById('input');

          function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');
            messageDiv.innerHTML = '<p>' + text + '</p>';
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, true);
            input.value = '';

            vscode.postMessage({
              command: 'sendMessage',
              text: text
            });
          }

          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          });

          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'receiveMessage') {
              let text = message.message;
              if (message.code) {
                text += '<br><br><code>' + message.code + '</code>';
              }
              addMessage(text, false);
            } else if (message.command === 'error') {
              addMessage('Error: ' + message.error, false);
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}

