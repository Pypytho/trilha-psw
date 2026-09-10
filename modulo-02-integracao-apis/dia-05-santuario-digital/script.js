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
        // ETAPA 1: Busca restringindo via sintaxe de categorias da MediaWiki
        // Agrupa o termo digitado obrigando a pertencer a uma das categorias hagiográficas
        const queryFiltro = `${termo} (incategory:Santos OR incategory:Santas OR incategory:"Santos católicos" OR incategory:"Santas católicas" OR incategory:Papas OR incategory:Beatos)`;
        
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryFiltro)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) throw new Error(`Erro na conexão (Status: ${searchResponse.status})`);

        const searchData = await searchResponse.json();

        // Se a busca combinada não encontrar nada
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`"${termo}" não foi encontrado no acervo de Santos e Santas da Wikipedia.`);
        }

        // Pega os 3 primeiros resultados para validar
        const resultados = searchData.query.search.slice(0, 3);
        let artigoValido = null;

        const palavrasChaveHagiograficas = [
            'santo', 'santa', 'são', 'canonizad', 'beatificad', 'mártir', 
            'papa', 'bispo', 'virgem', 'doutor da igreja', 'místico', 'mística',
            'religioso', 'religiosa', 'igreja católica'
        ];

        for (const item of resultados) {
            // ETAPA 2: Carrega os dados do artigo retornado
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

            // Bloqueio explícito de termos seculares comuns
            if (tituloLower.includes('futebol') || tituloLower.includes('clube') || tituloLower.includes('município')) {
                continue;
            }

            // Checa se o texto do resumo realmente condiz com uma figura de santidade
            const ehHagiografico = palavrasChaveHagiograficas.some(p => extractLower.includes(p) || tituloLower.includes(p));

            if (ehHagiografico) {
                artigoValido = artigo;
                break; // Achou o artigo do santo!
            }
        }

        if (!artigoValido) {
            throw new Error(`"${termo}" não corresponde a um Santo ou Santa reconhecido.`);
        }

        // ETAPA 3: Injeta no DOM
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
