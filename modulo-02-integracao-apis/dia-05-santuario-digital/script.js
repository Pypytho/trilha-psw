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
        // Consultas priorizadas para focar no contexto religioso
        const consultas = [
            `São ${termo}`,
            `Santo ${termo}`,
            `Santa ${termo}`,
            `${termo} (santo)`,
            `${termo} (santa)`,
            termo
        ];

        let artigoEncontrado = null;

        // LISTA NEGRA: Se a categoria ou o título contiver qualquer um destes termos, DESCARTA imediatamente!
        const termosProibidos = [
            'futebol', 'clube', 'esporte', 'associação', 'município', 'cidade', 'bairro',
            'apresentador', 'empresário', 'televisão', 'série', 'filme', 'álbum', 'música',
            'estádio', 'hospital', 'universidade', 'estação', 'rodovia', 'desambiguação'
        ];

        // LISTA BRANCA: Categorias/termos obrigatoriamente ligados à santidade/canonização
        const termosReligiosos = [
            'santos', 'santas', 'mártires', 'papas', 'beatos', 'beatas',
            'canonizados', 'místicos', 'místicas', 'religiosos', 'bispos', 'frades',
            'freiras', 'teólogos', 'doutores da igreja'
        ];

        for (const query of consultas) {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) continue;

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) continue;

            // Analisa os resultados da busca
            for (const item of searchData.query.search.slice(0, 5)) {
                const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=100&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const summaryResponse = await fetch(summaryUrl);
                if (!summaryResponse.ok) continue;

                const summaryData = await summaryResponse.json();
                const pages = summaryData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const tituloLower = artigo.title.toLowerCase();
                const extractLower = (artigo.extract || '').toLowerCase();

                // Monta texto das categorias
                const categorias = artigo.categories 
                    ? artigo.categories.map(c => c.title.toLowerCase()).join(' ') 
                    : '';

                const textoCompletoParaAnalise = `${tituloLower} ${categorias}`;

                // 1. FILTRO DE EXCLUSÃO (BLACK LIST)
                // Se contiver qualquer palavra proibida (como clube, apresentador, futebol), ignora na hora
                const ehProibido = termosProibidos.some(proibido => textoCompletoParaAnalise.includes(proibido));
                if (ehProibido) {
                    continue; // Pula para o próximo artigo da lista
                }

                // 2. FILTRO DE INCLUSÃO (WHITE LIST)
                // Checa se o artigo tem indícios reais de ser uma pessoa canonizada/religiosa
                const ehSantoPorCategoria = termosReligiosos.some(termoSacro => categorias.includes(termoSacro));
                
                const ehSantoPorTitulo = 
                    tituloLower.startsWith('santo ') || 
                    tituloLower.startsWith('santa ') || 
                    tituloLower.startsWith('são ') || 
                    tituloLower.includes('(santo)') || 
                    tituloLower.includes('(santa)');

                const ehSantoPorTexto = (
                    extractLower.includes('canonizad') || 
                    extractLower.includes('beatificad') || 
                    extractLower.includes('mártir') || 
                    extractLower.includes('igreja católica') ||
                    extractLower.includes('festa litúrgica')
                );

                // Só aceita se passar no filtro e tiver ligação com santidade
                if (ehSantoPorCategoria || ehSantoPorTitulo || ehSantoPorTexto) {
                    artigoEncontrado = artigo;
                    break;
                }
            }

            if (artigoEncontrado) break;
        }

        if (!artigoEncontrado) {
            throw new Error(`Nenhum santo ou santa encontrado para "${termo}". Tente buscar por um nome como "Agostinho", "Rita", "Francisco" ou "Expedito".`);
        }

        // Renderização dos dados validados
        setTexto(saintName, artigoEncontrado.title);
        setTexto(saintBio, artigoEncontrado.extract || 'Nenhum resumo disponível para este artigo.');

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
        setTexto(statusMessage, `[Filtro de Segurança]: ${erro.message}`);
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
