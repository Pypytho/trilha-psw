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

// Palavras que OBRIGATORIAMENTE indicam um artigo hagiográfico/religioso
const TERMOS_SACROS = [
    'santo', 'santa', 'são', 'canonizad', 'beatificad', 'mártir', 
    'papa', 'bispo', 'virgem', 'doutor da igreja', 'igreja católica', 
    'festa litúrgica', 'beato', 'beata', 'frade', 'monge', 'freira', 'religios'
];

// Palavras que BLOQUEIAM o resultado para evitar times, cidades ou celebridades
const TERMOS_PROIBIDOS = [
    'futebol', 'clube', 'esporte', 'estádio', 'município', 'prefeitura',
    'apresentador', 'televisão', 'empresa', 'associação', 'campeonato'
];

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Pesquisando no acervo de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        const termoLower = termo.toLowerCase();
        let queryBusca = '';

        // Se o usuário já digitou São, Santo ou Santa
        if (termoLower.startsWith('são ') || termoLower.startsWith('santo ') || termoLower.startsWith('santa ') || termoLower.startsWith('beato ') || termoLower.startsWith('beata ')) {
            queryBusca = termo;
        } else {
            // Adiciona "Santo" para forçar o algoritmo de relevância da Wikipedia a ranquear figuras sacras no topo
            queryBusca = `Santo ${termo}`;
        }

        // ETAPA 1: Busca de artigos usando a API Action da MediaWiki (livre de erros de rota 404)
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) throw new Error(`Erro na conexão com a Wikipedia (Status: ${searchResponse.status})`);

        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum registro encontrado para "${termo}".`);
        }

        // ETAPA 2: Analisa os 5 primeiros resultados para validar se algum é realmente um Santo
        const resultados = searchData.query.search.slice(0, 5);
        let artigoValido = null;

        for (const item of resultados) {
            // Requisita o resumo e os detalhes da página
            const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
            
            const summaryResponse = await fetch(summaryUrl);
            if (!summaryResponse.ok) continue;

            const summaryData = await summaryResponse.json();
            const pages = summaryData.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") continue;

            const artigo = pages[pageId];
            const tituloLower = artigo.title.toLowerCase();
            const extractLower = (artigo.extract || '').toLowerCase();

            // BLOQUEIO: Se o título ou o texto tiver termos de esporte/cidade/TV
            const ehProibido = TERMOS_PROIBIDOS.some(t => tituloLower.includes(t) || extractLower.includes(t));
            if (ehProibido) continue;

            // VALIDAÇÃO: Se tiver termos religiosos/católicos no título ou resumo
            const ehSacro = TERMOS_SACROS.some(t => tituloLower.includes(t) || extractLower.includes(t));

            if (ehSacro) {
                artigoValido = artigo;
                break; // Achou o santo! Sai do loop.
            }
        }

        if (!artigoValido) {
            throw new Error(`"${termo}" não foi identificado como um Santo ou Santa no acervo.`);
        }

        // ETAPA 3: Exibe os dados validados na tela
        setTexto(saintName, artigoValido.title);
        setTexto(saintBio, artigoValido.extract || 'Nenhum resumo em texto disponível.');

        if (saintImg) {
            if (artigoValido.original && artigoValido.original.source) {
                saintImg.src = artigoValido.original.source;
                saintImg.style.display = 'block';
            } else {
                saintImg.style.display = 'none';
            }
        }

        if (saintLink && artigoValido.fullurl) {
            saintLink.href = artigoValido.fullurl;
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
