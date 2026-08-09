# Talão OS

Aplicativo de página única para gerar Ordens de Serviço (OS) em PDF, pensado
para oficinas mecânicas e prestadores de serviço em geral. Sem backend, sem
build — 100% HTML/CSS/JS estático.

## Como usar

1. Abra `index.html` num navegador (ou publique a pasta inteira em qualquer
   hospedagem estática).
2. Na primeira execução, cadastre o nome (e, opcionalmente, o logo) da sua
   oficina.
3. Preencha os dados do cliente, veículo (opcional), serviços e peças
   (opcional).
4. Clique em **Gerar PDF** para baixar a via da OS, ou em **Imprimir** para
   usar a impressão nativa do navegador como alternativa.

O rascunho da OS em edição é salvo automaticamente no navegador, para
sobreviver a uma queda de conexão ou recarregamento acidental — ele é limpo
assim que o PDF é gerado com sucesso.

## Deploy

Como não há etapa de build, basta subir a pasta do projeto em qualquer
hosting estático:

- **GitHub Pages**: habilite o Pages apontando para a branch/pasta raiz do
  repositório.
- **Netlify / Vercel**: aponte o deploy para a raiz do projeto, sem comando
  de build.
- **Servidor próprio**: copie os arquivos para o diretório público de
  qualquer servidor HTTP estático (Nginx, Apache, etc.).

## Dados e privacidade

Todos os dados (empresa, contador de OS, rascunho em edição) ficam salvos
apenas no `localStorage` do navegador do dispositivo usado — nada é enviado
para servidores externos. A camada de acesso a dados (`js/repository.js`) já
é isolada para permitir trocar essa persistência por uma API no futuro, sem
alterar o restante do app.

## Estrutura do projeto

```
├── index.html
├── css/          → tokens, reset, layout, componentes e impressão
├── js/
│   ├── main.js             → ponto de entrada, orquestra estado + UI
│   ├── store.js             → estado central + pub/sub
│   ├── repository.js        → acesso a dados (localStorage)
│   ├── utils/                → formatação e hash de referência
│   ├── ui/                    → seções de formulário, prévia, modal, toast
│   ├── pdf/generatePdf.js     → geração do PDF (jsPDF, carregado sob demanda)
│   └── whatsapp.js            → link de envio via WhatsApp
```

## Fora de escopo (por enquanto)

- Histórico/lista de OS com status
- Login / múltiplos usuários
- QR code de verificação online
- Backend / API
