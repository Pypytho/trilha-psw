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
        const termoLower = termo.toLowerCase();
        
        // Se a pessoa já digitou "São", "Santo" ou "Santa", usa o termo direto.
        // Se digitou apenas o nome (ex: "Agostinho"), adiciona "Santo " para focar no artigo religioso.
        let termoPesquisa = termo;
        if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ')) {
            termoPesquisa = `Santo ${termo}`;
        }

        // ETAPA 1: Busca o artigo mais relevante
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoPesquisa)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`Erro de rede ao conectar com a Wikipedia (Status: ${searchResponse.status})`);
        }

        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum resultado encontrado para "${termo}".`);
        }

        // Analisa os 3 primeiros resultados
        const resultados = searchData.query.search.slice(0, 3);
        let artigoEncontrado = null;

        for (const item of resultados) {
            const tituloLower = item.title.toLowerCase();

            // BLOQUEIO RESTRITO: Só descarta se o título for explicitamente um clube ou município
            if (tituloLower.includes('futebol clube') || tituloLower.includes('município de') || tituloLower.includes('esporte clube')) {
                continue;
            }

            // Pega o resumo da página selecionada
            const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
            
            const summaryResponse = await fetch(summaryUrl);
            if (!summaryResponse.ok) continue;

            const summaryData = await summaryResponse.json();
            const pages = summaryData.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") continue;

            const artigo = pages[pageId];
            const extractLower = (artigo.extract || '').toLowerCase();

            // VALIDAÇÃO SIMPLES: Garante que o texto tenha relação com o universo religioso/católico
            const palavrasSacras = ['santo', 'santa', 'são', 'bispo', 'papa', 'mártir', 'igreja', 'canonizad', 'religios', 'virgem', 'frade', 'freira', 'doutor da igreja'];
            const ehSacro = palavrasSacras.some(p => tituloLower.includes(p) || extractLower.includes(p));

            if (ehSacro) {
                artigoEncontrado = artigo;
                break;
            }
        }

        if (!artigoEncontrado) {
            throw new Error(`"${termo}" não foi identificado como um Santo ou Santa no acervo.`);
        }

        // ETAPA 2: Renderiza na tela
        setTexto(saintName, artigoEncontrado.title);
        setTexto(saintBio, artigoEncontrado.extract || 'Nenhum resumo disponível.');

        if (saintImg) {
            if (artigoEncontrado.original && artigoEncontrado.original.source) {
                saintImg.src = artigoEncontrado.original.source;
                saintImg.style.display = 'block';
            } else {
                saintImg.style.display = 'none';
            }
        }

        if (saintLink && artigoEncontrado.fullurl) {
            saintLink.href = artigoEncontrado.fullurl;
        }

        setTexto(statusMessage, '');
        if (saintCard) saintCard.classList.remove('hidden');

    } catch (erro) {
        console.error("Erro detalhado na busca:", erro);
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
