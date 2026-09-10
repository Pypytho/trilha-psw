console.log(">>> SISTEMA VIA WIKIDATA CARREGADO <<<");

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
        setTexto(statusMessage, 'Buscando santo canonizado...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();
            let queryBusca = termo;

            // Adiciona "Santo" se não começar com prefixo comum
            if (!termoLower.startsWith('são ') && 
                !termoLower.startsWith('santo ') && 
                !termoLower.startsWith('santa ') && 
                !termoLower.startsWith('beato ') && 
                !termoLower.startsWith('beata ')) {
                queryBusca = `Santo ${termo}`;
            }

            // Busca na Wikipedia
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
            
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            console.log("Resultados da busca Wikipedia:", searchData.query.search);

            if (!searchData.query?.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhuma página encontrada para "${termo}".`);
            }

            // Tenta cada resultado e valida se é santo
            const candidatos = searchData.query.search.slice(0, 10);

            for (const cand of candidatos) {
                console.log("Validando candidato:", cand.title);

                const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&titles=${encodeURIComponent(cand.title)}&format=json&origin=*`;
                
                const detailsRes = await fetch(detailsUrl);
                const detailsData = await detailsRes.json();
                const pages = Object.values(detailsData.query.pages);

                if (pages.length === 0 || pages[0].missing) {
                    console.log("Página não encontrada:", cand.title);
                    continue;
                }

                const page = pages[0];
                
                // Valida se tem categorias de santo
                if (page.categories && page.categories.length > 0) {
                    const cats = page.categories.map(c => c.title.toLowerCase());
                    console.log("Categorias de", cand.title, ":", cats);
                    
                    const ehSanto = cats.some(c => 
                        c.includes('santos católicos') || 
                        c.includes('santas católicas') ||
                        c.includes('doutores da igreja') ||
                        c.includes('beatos católicos') ||
                        c.includes('beatas católicas') ||
                        c.includes('canonizados')
                    );

                    if (ehSanto) {
                        console.log("✓ Santo encontrado e validado:", cand.title);
                        renderizarPagina(page);
                        setTexto(statusMessage, '');
                        if (saintCard) saintCard.classList.remove('hidden');
                        return;
                    }
                }
            }

            throw new Error(`"${termo}" não é um Santo ou Santa canonizado pela Igreja Católica.`);

        } catch (erro) {
            console.error("Erro:", erro);
            setTexto(statusMessage, `[Aviso]: ${erro.message}`);
            if (saintCard) saintCard.classList.add('hidden');
        }
    }

    function renderizarPagina(artigo) {
        setTexto(saintName, artigo.title);
        setTexto(saintBio, artigo.extract || 'Resumo não disponível.');

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
});
