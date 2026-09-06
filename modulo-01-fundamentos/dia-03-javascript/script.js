// 1. Captura de referências aos elementos do DOM
const btnTheme = document.querySelector('#btn-theme');
const bodyElement = document.body;
const statusText = document.querySelector('#main-status');

// 2. Adição do escutador de eventos (click)
btnTheme.addEventListener('click', () => {
    // Alterna a presença das classes 'dark-theme' e 'light-theme' no <body>
    bodyElement.classList.toggle('dark-theme');
    bodyElement.classList.toggle('light-theme');

    // Verifica qual tema está ativo no momento para atualizar o texto da página
    const isLightTheme = bodyElement.classList.contains('light-theme');

    if (isLightTheme) {
        statusText.innerHTML = 'Estado atual: <strong>Tema Claro Ativo</strong>';
    } else {
        statusText.innerHTML = 'Estado atual: <strong>Tema Escuro Ativo</strong>';
    }
});
