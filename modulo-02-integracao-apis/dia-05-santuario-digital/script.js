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
        // ETAPA 1: Tenta buscar pelo termo combinado com palavras-chave hagiográficas
        // Montamos consultas alternativas para garantir que o resultado seja um santo
        const consultas = [
            `Santo ${termo}`,
            `Santa ${termo}`,
            `São ${termo}`,
            `${termo} (santo)`,
            `${termo} (santa)`,
            termo
        ];

        let artigoEncontrado = null;

        for (const query of consultas) {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) continue;

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) continue;

            // Percorre os 3 primeiros resultados para verificar se algum é um Santo
            for (const item of searchData.query.search.slice(0, 3)) {
                const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const summaryResponse = await fetch(summaryUrl);
                if (!summaryResponse.ok) continue;

                const summaryData = await summaryResponse.json();
                const pages = summaryData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const tituloLower = artigo.title.toLowerCase();
                const extractLower = (artigo.extract || '').toLowerCase();

                // Monta a lista de categorias em formato normalizado (sem "Categoria:")
                const categorias = artigo.categories 
                    ? artigo.categories.map(c => c.title.toLowerCase()) 
                    : [];

                // 1. Checagem por Categoria
                const ehSantoPorCategoria = categorias.some(cat => 
                    cat.includes('santo') || 
                    cat.includes('santa') || 
                    cat.includes('mártir') || 
                    cat.includes('papa') || 
                    cat.includes('beato') ||
                    cat.includes('canonizado') ||
                    cat.includes('religioso')
                );

                // 2. Checagem por Título
                const ehSantoPorTitulo = 
                    tituloLower.startsWith('santo ') || 
                    tituloLower.startsWith('santa ') || 
                    tituloLower.startsWith('são ') || 
                    tituloLower.includes('(santo)') || 
                    tituloLower.includes('(santa)');

                // 3. Checagem por Termos no Resumo
                const termosSacros = ['santo', 'santa', 'canonizad', 'mártir', 'virgem', 'beatificad', 'igreja católica', 'bispo'];
                const ehSantoPorTexto = termosSacros.some(t => extractLower.includes(t));

                if (ehSantoPorCategoria || ehSantoPorTitulo || (ehSantoPorTexto && (tituloLower.includes(termo.toLowerCase())))) {
                    artigoEncontrado = artigo;
                    break;
                }
            }

            if (artigoEncontrado) break;
        }

        if (!artigoEncontrado) {
            throw new Error(`Nenhum santo ou santa encontrado para "${termo}". Certifique-se de digitar o nome correto.`);
        }

        // ETAPA 2: Renderização dos dados
        setTexto(saintName, artigoEncontrado.title);
        setTexto(saintBio, artigoEncontrado.extract || 'Nenhum resumo em texto disponível para este artigo.');

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
