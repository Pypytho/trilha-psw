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

// Categorias aceitas que definem um Santo/Santa ou figura canonizada na Wikipedia
const CATEGORIAS_VALIDAS = [
    'santos', 'santas', 'mártires', 'papas', 'beatos', 'beatas', 
    'canonizados', 'místicos', 'doutores da igreja', 'religiosos católicos'
];

// Termos estritamente proibidos em títulos para evitar falsos positivos rápidos
const BLOQUEIO_TITULO = ['futebol', 'clube', 'município', 'estádio', 'associação', 'hospital'];

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Buscando nos arquivos hagiográficos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // ETAPA 1: Busca ampla por artigos relacionados ao termo
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) throw new Error(`Falha de rede (Status: ${searchResponse.status})`);
        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum artigo encontrado para "${termo}".`);
        }

        // Pega até 5 resultados e verifica um por um pelas categorias oficiais
        const resultados = searchData.query.search.slice(0, 5);
        let artigoValido = null;

        for (const item of resultados) {
            const tituloLower = item.title.toLowerCase();

            // Bloqueio imediato se o título contiver palavras como "futebol" ou "clube"
            if (BLOQUEIO_TITULO.some(p => tituloLower.includes(p))) {
                continue;
            }

            // ETAPA 2: Consulta as categorias reais indexadas na página da Wikipedia
            const catUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=categories|extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=100&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
            const catResponse = await fetch(catUrl);
            if (!catResponse.ok) continue;

            const catData = await catResponse.json();
            const pages = catData.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") continue;

            const artigo = pages[pageId];
            
            // Extrai a lista de nomes das categorias da página
            const listaCategorias = artigo.categories 
                ? artigo.categories.map(c => c.title.toLowerCase()) 
                : [];

            // Checa se pelo menos UMA das categorias oficiais de santidade está presente
            const ehSantoConfirmado = listaCategorias.some(cat => 
                CATEGORIAS_VALIDAS.some(valida => cat.includes(valida))
            );

            // Validação secundária para títulos que já começam com o prefixo
            const ehSantoPorTitulo = tituloLower.startsWith('santo ') || 
                                     tituloLower.startsWith('santa ') || 
                                     tituloLower.startsWith('são ') || 
                                     tituloLower.includes('(santo)') || 
                                     tituloLower.includes('(santa)');

            if (ehSantoConfirmado || ehSantoPorTitulo) {
                artigoValido = artigo;
                break; // Encontrou o artigo legítimo!
            }
        }

        // Se após varrer os resultados nenhum for um Santo de fato
        if (!artigoValido) {
            throw new Error(`"${termo}" não corresponde a um Santo ou Santa católico reconhecido.`);
        }

        // ETAPA 3: Exibe os dados do Santo validado na tela
        setTexto(saintName, artigoValido.title);
        setTexto(saintBio, artigoValido.extract || 'Nenhum resumo em texto disponível para este artigo.');

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
