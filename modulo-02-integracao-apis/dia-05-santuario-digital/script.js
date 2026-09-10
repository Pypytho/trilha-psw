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

// Função auxiliar para atualizar texto de forma segura sem dar crash
function setTexto(elemento, texto) {
    if (elemento) {
        elemento.textContent = texto;
    }
}

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    setTexto(statusMessage, 'Pesquisando na Wikipedia...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // ETAPA 1: Pesquisa inteligente pelo termo na Wikipedia
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoBusca.trim())}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`Erro na conexão (Status: ${searchResponse.status})`);
        }

        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum artigo encontrado para "${termoBusca}".`);
        }

        const tituloExato = searchData.query.search[0].title;

        // ETAPA 2: Obtém o resumo e imagem do artigo encontrado
        const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(tituloExato)}&format=json&origin=*`;
        
        const summaryResponse = await fetch(summaryUrl);
        if (!summaryResponse.ok) {
            throw new Error(`Erro ao carregar o artigo (Status: ${summaryResponse.status})`);
        }

        const summaryData = await summaryResponse.json();
        const pages = summaryData.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") {
            throw new Error('Página não encontrada no acervo da Wikipedia.');
        }

        const artigo = pages[pageId];

        // ETAPA 3: Injeta com segurança no DOM
        setTexto(saintName, artigo.title);
        setTexto(saintBio, artigo.extract || 'Nenhum resumo disponível para este artigo.');

        // Trata a imagem
        if (saintImg) {
            if (artigo.original && artigo.original.source) {
                saintImg.src = artigo.original.source;
                saintImg.style.display = 'block';
            } else {
                saintImg.style.display = 'none';
            }
        }

        // Link oficial
        if (saintLink && artigo.fullurl) {
            saintLink.href = artigo.fullurl;
        }

        setTexto(statusMessage, '');
        if (saintCard) saintCard.classList.remove('hidden');

    } catch (erro) {
        setTexto(statusMessage, `[Aviso]: ${erro.message}`);
    }
}

// Escutadores de Eventos
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        if (saintInput) buscarSantoWikipedia(saintInput.value);
    });
}

if (saintInput) {
    saintInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') buscarSantoWikipedia(saintInput.value);
    });
}

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const nome = chip.getAttribute('data-name');
        if (saintInput) saintInput.value = nome;
        buscarSantoWikipedia(nome);
    });
});
