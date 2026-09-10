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

function setTexto(elemento, texto) {
    if (elemento) elemento.textContent = texto;
}

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Pesquisando na biblioteca de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // Usa a busca avançada da Wikipedia filtrando OBRIGATORIAMENTE por categorias hagiográficas
        // O operando incategory: garante que a Wikipedia só busque dentro dos acervos religiosos
        const queryFiltro = `"${termo}" (incategory:"Santos" OR incategory:"Santas" OR incategory:"Santos católicos" OR incategory:"Santas católicas" OR incategory:"Beatos" OR incategory:"Papas")`;
        
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryFiltro)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) throw new Error(`Erro de conexão (Status: ${searchResponse.status})`);

        const searchData = await searchResponse.json();

        // Se a Wikipedia não encontrar o termo DENTRO das categorias de Santos, dá erro de imediato!
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`"${termo}" não foi encontrado no acervo de Santos e Santas da Wikipedia.`);
        }

        // Pega o primeiro artigo garantido pela própria Wikipedia como integrante da Categoria Santos
        const tituloExato = searchData.query.search[0].title;

        // ETAPA 2: Carrega o conteúdo do artigo validado
        const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(tituloExato)}&format=json&origin=*`;
        
        const summaryResponse = await fetch(summaryUrl);
        if (!summaryResponse.ok) throw new Error(`Erro ao carregar detalhes do artigo.`);

        const summaryData = await summaryResponse.json();
        const pages = summaryData.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") throw new Error('Artigo não encontrado.');

        const artigo = pages[pageId];

        // ETAPA 3: Renderização no DOM
        setTexto(saintName, artigo.title);
        setTexto(saintBio, artigo.extract || 'Nenhum resumo disponível.');

        if (saintImg) {
            if (artigo.original && artigo.original.source) {
                saintImg.src = artigo.original.source;
                saintImg.style.display = 'block';
            } else {
                saintImg.style.display = 'none';
            }
        }

        if (saintLink && artigo.fullurl) {
            saintLink.href = artigo.fullurl;
        }

        setTexto(statusMessage, '');
        if (saintCard) saintCard.classList.remove('hidden');

    } catch (erro) {
        setTexto(statusMessage, `[Aviso]: ${erro.message}`);
    }
}

// Event Listeners
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
