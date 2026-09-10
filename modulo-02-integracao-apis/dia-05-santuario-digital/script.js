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
        // ETAPA 1: Busca o termo via API de pesquisa da Wikipedia
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoBusca.trim())}&format=json&origin=*`;
        
        console.log('Enviando requisição para:', searchUrl);
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
            throw new Error(`Erro na busca da Wikipedia (Status: ${searchResponse.status})`);
        }

        const searchData = await searchResponse.json();

        // Checa se a estrutura de dados veio correta
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum artigo encontrado para "${termoBusca}". Tente digitar de outra forma.`);
        }

        const tituloExato = searchData.query.search[0].title;
        console.log('Título encontrado:', tituloExato);

        // ETAPA 2: Busca o resumo usando o endpoint de API tradicional (com suporte a CORS e origin=*)
        const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(tituloExato)}&format=json&origin=*`;
        
        const summaryResponse = await fetch(summaryUrl);

        if (!summaryResponse.ok) {
            throw new Error(`Erro ao carregar dados do artigo (Status: ${summaryResponse.status})`);
        }

        const summaryData = await summaryResponse.json();
        const pages = summaryData.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") {
            throw new Error('Página não encontrada no acervo da Wikipedia.');
        }

        const artigo = pages[pageId];

        // ETAPA 3: Injeta no HTML
        saintName.textContent = artigo.title;
        saintBio.textContent = artigo.extract || 'Nenhum resumo em texto disponível para este artigo.';

        // Imagem
        if (artigo.original && artigo.original.source) {
            saintImg.src = artigo.original.source;
            saintImg.style.display = 'block';
        } else {
            saintImg.style.display = 'none';
        }

        // Link oficial
        if (artigo.fullurl) {
            saintLink.href = artigo.fullurl;
        }

        statusMessage.textContent = '';
        saintCard.classList.remove('hidden');

    } catch (erro) {
        // Exibe o erro real diretamente na tela
        statusMessage.textContent = `[Erro]: ${erro.message}`;
        console.error('Detalhes do Erro:', erro);
    }
}

// Event Listeners
if (searchBtn) {
    searchBtn.addEventListener('click', () => buscarSantoWikipedia(saintInput.value));
}

if (saintInput) {
    saintInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarSantoWikipedia(saintInput.value);
    });
}

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const nome = chip.getAttribute('data-name');
        saintInput.value = nome;
        buscarSantoWikipedia(nome);
    });
});
