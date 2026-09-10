// Referências aos elementos do DOM
const saintInput = document.querySelector('#saint-input');
const searchBtn = document.querySelector('#search-btn');
const statusMessage = document.querySelector('#status-message');
const chips = document.querySelectorAll('.chip');

const saintCard = document.querySelector('#saint-card');
const saintImg = document.querySelector('#saint-img');
const saintName = document.querySelector('#saint-name');
const saintBio = document.querySelector('#saint-bio');
const saintLink = document.querySelector('#saint-link');

// Função assíncrona que faz requisição à API REST da Wikipedia
async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca) {
        statusMessage.textContent = 'Por favor, digite o nome de um santo.';
        return;
    }

    statusMessage.textContent = 'Buscando registros na Wikipedia...';
    saintCard.classList.add('hidden');

    // Formata o termo de busca: substitui espaços por sublinhados (padrão de URLs da Wikipedia)
    const termoFormatado = encodeURIComponent(termoBusca.trim().replace(/ /g, '_'));

    try {
        // Endpoint REST oficial da Wikipedia para resumos de artigos em Português
        const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${termoFormatado}`;
        
        const resposta = await fetch(url);

        // Se a página do artigo não existir na Wikipedia (Erro 404)
        if (!resposta.ok) {
            throw new Error(`Não foi possível encontrar a página para "${termoBusca}". Tente digitar o nome completo, ex: "São Francisco de Assis".`);
        }

        const data = await resposta.json();

        // Injeta os dados retornados pela Wikipedia no DOM
        saintName.textContent = data.title;
        saintBio.textContent = data.extract || 'Nenhum resumo em texto disponível para este artigo.';
        
        // Trata a imagem: se o artigo possuir imagem principal, exibe-a; senão, esconde o elemento <img>
        if (data.thumbnail && data.thumbnail.source) {
            saintImg.src = data.thumbnail.source;
            saintImg.style.display = 'block';
        } else {
            saintImg.style.display = 'none';
        }

        // Define o link direto para a página completa do artigo na Wikipedia
        if (data.content_urls && data.content_urls.desktop) {
            saintLink.href = data.content_urls.desktop.page;
        }

        // Limpa a mensagem de carregamento e exibe o cartão
        statusMessage.textContent = '';
        saintCard.classList.remove('hidden');

    } catch (erro) {
        statusMessage.textContent = erro.message;
    }
}

// Escuta o clique no botão de busca
searchBtn.addEventListener('click', () => {
    const termo = saintInput.value;
    buscarSantoWikipedia(termo);
});

// Escuta a tecla "Enter" no campo de texto
saintInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const termo = saintInput.value;
        buscarSantoWikipedia(termo);
    }
});

// Escuta os cliques nas sugestões rápidas
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const nomeSanto = chip.getAttribute('data-name');
        saintInput.value = nomeSanto;
        buscarSantoWikipedia(nomeSanto);
    });
});
