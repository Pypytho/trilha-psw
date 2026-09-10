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

// Prefixos válidos para considerar uma página como figura de santidade
const PREFIXOS_SAGRADOS = ['santo ', 'santa ', 'são ', 'beato ', 'beata '];

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termoOriginal = termoBusca.trim();
    setTexto(statusMessage, 'Pesquisando na biblioteca de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // Monta os termos de tentativa focando estritamente no título do Santo
        const termoLower = termoOriginal.toLowerCase();
        let listaBuscas = [];

        // Se o usuário já digitou "São", "Santo" ou "Santa", busca direto
        if (PREFIXOS_SAGRADOS.some(p => termoLower.startsWith(p))) {
            listaBuscas = [termoOriginal];
        } else {
            // Se digitou apenas o nome (ex: "Rita"), força as buscas sagradas primeiro
            listaBuscas = [
                `Santo ${termoOriginal}`,
                `Santa ${termoOriginal}`,
                `São ${termoOriginal}`,
                `Beato ${termoOriginal}`,
                `Beata ${termoOriginal}`,
                `${termoOriginal} (santo)`,
                `${termoOriginal} (santa)`
            ];
        }

        let artigoEncontrado = null;

        // Testa cada variação até achar um artigo cujo TÍTULO seja comprovadamente de um Santo
        for (const consulta of listaBuscas) {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(consulta)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) continue;

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) continue;

            // Analisa o primeiro resultado da busca
            const primeiroResultado = searchData.query.search[0];
            const tituloLower = primeiroResultado.title.toLowerCase();

            // VALIDAÇÃO RIGOROSA DE TÍTULO:
            // O artigo retornado DEVE começar com Santo/Santa/São/Beato/Beata ou conter (santo)/(santa)
            const ehValido = PREFIXOS_SAGRADOS.some(p => tituloLower.startsWith(p)) ||
                             tituloLower.includes('(santo)') || 
                             tituloLower.includes('(santa)');

            if (ehValido) {
                artigoEncontrado = primeiroResultado.title;
                break; // Achou o artigo do Santo correto!
            }
        }

        // Se nenhuma das tentativas retornar um artigo com título hagiográfico
        if (!artigoEncontrado) {
            throw new Error(`"${termoOriginal}" não é um Santo ou Santa reconhecido. Tente pesquisar nomes como "Rita", "Agostinho", "Bento" ou "Expedito".`);
        }

        // ETAPA 2: Carrega os dados do artigo de Santo validado
        const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(artigoEncontrado)}&format=json&origin=*`;
        
        const summaryResponse = await fetch(summaryUrl);
        if (!summaryResponse.ok) throw new Error(`Erro ao carregar detalhes do artigo.`);

        const summaryData = await summaryResponse.json();
        const pages = summaryData.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") throw new Error('Artigo não encontrado.');

        const artigo = pages[pageId];

        // ETAPA 3: Renderização
        setTexto(saintName, artigo.title);
        setTexto(saintBio, artigo.extract || 'Nenhum resumo em texto disponível para este artigo.');

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
