# Organizador de Tarefas Diárias

Aplicação web simples para registrar e acompanhar tarefas pessoais. Projeto acadêmico da unidade curricular Projeto e Engenharia de Software (A3).

## Funcionalidades

- Cadastrar tarefa com título, detalhes opcionais, prazo e prioridade.
- Consultar todas as tarefas ou filtrar pendentes e concluídas.
- Editar, excluir, concluir e reabrir tarefas.
- Ver resumo de tarefas totais, pendentes e concluídas.
- Manter os dados no mesmo navegador usando LocalStorage.

## Como executar no Windows

1. Instale o Python 3, se ainda não estiver instalado.
2. Execute `iniciar_projeto.bat` nesta pasta.
3. Abra `http://127.0.0.1:8000` no navegador.
4. Para encerrar, feche a janela do terminal.

Alternativamente, abra o terminal nesta pasta e execute:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

## Tecnologias

- HTML semântico
- CSS responsivo
- JavaScript
- LocalStorage do navegador

## Limitações conhecidas

Esta versão é de uso individual e não tem login, servidor, sincronização entre dispositivos, compartilhamento, notificações automáticas ou backup. As tarefas ficam no armazenamento local do navegador; limpar os dados do navegador pode apagá-las.

## Documentação do projeto

- [Requisitos e modelagem](docs/requisitos-e-modelagem.md)
- [Requisitos e modelagem (PDF)](docs/requisitos-e-modelagem.pdf)
- [Diagramas e fluxos (PDF)](docs/diagramas-e-fluxos.pdf)

Os documentos aqui são materiais produzidos para o projeto. O template e os PDFs originais fornecidos pelo professor não estão incluídos neste repositório.
