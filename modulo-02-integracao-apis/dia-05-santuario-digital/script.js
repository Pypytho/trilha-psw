document.addEventListener('DOMContentLoaded', () => {
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
        setTexto(statusMessage, 'Pesquisando no acervo...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            // 1. Faz a busca genérica na Wikipedia
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) throw new Error(`Falha de conexão com a Wikipedia.`);

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhum artigo encontrado para "${termo}".`);
            }

            // Pega os 5 primeiros resultados para analisar
            const resultados = searchData.query.search.slice(0, 5);
            let artigoEncontrado = null;

            for (const item of resultados) {
                // 2. Para cada resultado, busca os dados da página + CATEGORIAS da página
                const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=100&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const detailsResponse = await fetch(detailsUrl);
                if (!detailsResponse.ok) continue;

                const detailsData = await detailsResponse.json();
                const pages = detailsData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const tituloLower = artigo.title.toLowerCase();

                // Pega a lista de categorias do artigo em letras minúsculas
                const categorias = artigo.categories 
                    ? artigo.categories.map(c => c.title.toLowerCase()) 
                    : [];

                // REGRA DE BLOQUEIO: Se for time de futebol ou município
                const ehProibido = categorias.some(c => c.includes('futebol') || c.includes('município') || c.includes('clubes'));
                if (ehProibido) continue;

                // REGRA DE ACEITAÇÃO: Se o artigo pertence a categorias de santidade/religião
                const ehSantoPorCategoria = categorias.some(c => 
                    c.includes('santos') || 
                    c.includes('santas') || 
                    c.includes('beatos') || 
                    c.includes('beatas') || 
                    c.includes('mártires') || 
                    c.includes('papas') || 
                    c.includes('doutores da igreja') ||
                    c.includes('religiosos católicos')
                );

                // Ou se o próprio título já começa com prefixo de santidade
                const ehSantoPorTitulo = tituloLower.startsWith('são ') || 
                                         tituloLower.startsWith('santo ') || 
                                         tituloLower.startsWith('santa ') ||
                                         tituloLower.startsWith('beato ') ||
                                         tituloLower.startsWith('beata ');

                if (ehSantoPorCategoria || ehSantoPorTitulo) {
                    artigoEncontrado = artigo;
                    break; // Encontrou o artigo legítimo!
                }
            }

            if (!artigoEncontrado) {
                throw new Error(`"${termo}" não corresponde a um Santo, Santa ou figura canonizada no acervo.`);
            }

            // 3. Renderiza na tela
            setTexto(saintName, artigoEncontrado.title);
            setTexto(saintBio, artigoEncontrado.extract || 'Nenhum resumo em texto disponível.');

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

    // Eventos
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
});
