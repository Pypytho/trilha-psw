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
    setTexto(statusMessage, 'Buscando nos arquivos hagiográficos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // 1. Constrói uma lista de termos de pesquisa forçando o contexto religioso
        const termoLower = termo.toLowerCase();
        let variacoesBusca = [];

        // Se o usuário já digitou o prefixo (ex: "São Bento", "Santa Rita")
        if (termoLower.startsWith('são ') || termoLower.startsWith('santo ') || termoLower.startsWith('santa ') || termoLower.startsWith('beato ') || termoLower.startsWith('beata ')) {
            variacoesBusca = [termo];
        } else {
            // Se digitou apenas o nome solto (ex: "Agostinho", "Rita", "Bento")
            variacoesBusca = [
                `Santo ${termo}`,
                `Santa ${termo}`,
                `São ${termo}`,
                `${termo} de`,
                termo
            ];
        }

        let artigoValido = null;

        for (const query of variacoesBusca) {
            // Requisita a busca na Wikipedia
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) continue;

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) continue;

            // Varre os primeiros resultados para encontrar o artigo que possui categoria/propriedades de Santo
            for (const item of searchData.query.search.slice(0, 3)) {
                const pageUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const pageResponse = await fetch(pageUrl);
                if (!pageResponse.ok) continue;

                const pageData = await pageResponse.json();
                const pages = pageData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const titulo = artigo.title.toLowerCase();
                const resumo = (artigo.extract || '').toLowerCase();
                const categorias = artigo.categories ? artigo.categories.map(c => c.title.toLowerCase()) : [];

                // REGRAS DE BLOQUEIO ABSOLUTO (Futebol, Clubes, Cidades e Personalidades Seculares)
                const termosProibidos = ['futebol', 'clube', 'esporte', 'município', 'estádio', 'apresentador', 'televisão', 'empresa'];
                const ehProibido = termosProibidos.some(p => titulo.includes(p) || categorias.some(c => c.includes(p)));

                if (ehProibido) continue;

                // REGRAS DE VALIDAÇÃO RELIGIOSA
                const ehSantoPorCategoria = categorias.some(c => 
                    c.includes('santos') || c.includes('santas') || c.includes('mártires') || 
                    c.includes('papas') || c.includes('beatos') || c.includes('doutores da igreja')
                );

                const ehSantoPorTitulo = titulo.startsWith('santo ') || titulo.startsWith('santa ') || titulo.startsWith('são ') || titulo.includes('(santo)') || titulo.includes('(santa)');

                const ehSantoPorTexto = resumo.includes('canonizad') || resumo.includes('beatificad') || resumo.includes('festa litúrgica') || resumo.includes('doutor da igreja');

                // Valida se atende aos critérios religiosos
                if (ehSantoPorCategoria || ehSantoPorTitulo || ehSantoPorTexto) {
                    artigoValido = artigo;
                    break;
                }
            }

            if (artigoValido) break;
        }

        if (!artigoValido) {
            throw new Error(`Nenhum registro hagiográfico encontrado para "${termo}". Certifique-se de digitar o nome de um santo ou santa.`);
        }

        // Renderiza no DOM
        setTexto(saintName, artigoValido.title);
        setTexto(saintBio, artigoValido.extract || 'Nenhum resumo disponível.');

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
