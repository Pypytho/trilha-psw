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

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        statusMessage.textContent = 'Por favor, digite o nome de um santo.';
        return;
    }

    statusMessage.textContent = 'Pesquisando na Wikipedia...';
    saintCard.classList.add('hidden');

    try {
        // ETAPA 1: Busca o título exato do artigo mais relevante usando a API de busca da Wikipedia
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoBusca.trim())}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error('Falha na conexão com os servidores da Wikipedia.');
        }

        const searchData = await searchResponse.json();

        // Se a busca não retornar nenhum resultado
        if (!searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum artigo encontrado para "${termoBusca}". Tente digitar de outra forma.`);
        }

        // Pega o título exato do primeiro resultado da pesquisa
        const tituloExato = searchData.query.search[0].title;

        // ETAPA 2: Busca o resumo e imagem do artigo usando o título exato encontrado
        const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tituloExato)}`;
        const summaryResponse = await fetch(summaryUrl);

        if (!summaryResponse.ok) {
            throw new Error('Não foi possível carregar o resumo do artigo.');
        }

        const summaryData = await summaryResponse.json();

        // ETAPA 3: Renderiza as informações na tela
        saintName.textContent = summaryData.title;
        saintBio.textContent = summaryData.extract || 'Nenhum resumo em texto disponível para este artigo.';

        // Imagem principal
        if (summaryData.thumbnail && summaryData.thumbnail.source) {
            saintImg.src = summaryData.thumbnail.source;
            saintImg.style.display = 'block';
        } else {
            saintImg.style.display = 'none';
        }

        // Link oficial para a página
        if (summaryData.content_urls && summaryData.content_urls.desktop) {
            saintLink.href = summaryData.content_urls.desktop.page;
        }

        statusMessage.textContent = '';
        saintCard.classList.remove('hidden');

    } catch (erro) {
        statusMessage.textContent = erro.message;
        console.error('Erro na API:', erro);
    }
}

// Escuta o clique no botão
searchBtn.addEventListener('click', () => {
    buscarSantoWikipedia(saintInput.value);
});

// Escuta o Enter no input
saintInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        buscarSantoWikipedia(saintInput.value);
    }
});

// Escuta o clique nos chips
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const nomeSanto = chip.getAttribute('data-name');
        saintInput.value = nomeSanto;
        buscarSantoWikipedia(nomeSanto);
    });
});
