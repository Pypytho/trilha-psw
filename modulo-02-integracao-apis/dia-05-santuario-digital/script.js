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

    async function buscarWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite um termo para buscar.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Buscando na Wikipédia...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            // 1. Busca o artigo correspondente na Wikipédia
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) throw new Error('Falha na conexão com a Wikipédia.');

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhum resultado encontrado para "${termo}".`);
            }

            const primeiroResultado = searchData.query.search[0];

            // 2. Obtém os detalhes (resumo, imagem e link) da página encontrada
            const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(primeiroResultado.title)}&format=json&origin=*`;
            const detailsResponse = await fetch(detailsUrl);
            if (!detailsResponse.ok) throw new Error('Erro ao carregar detalhes do artigo.');

            const detailsData = await detailsResponse.json();
            const pages = detailsData.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") {
                throw new Error('Artigo não encontrado.');
            }

            const artigo = pages[pageId];

            // 3. Renderiza os dados no card
            setTexto(saintName, artigo.title);
            setTexto(saintBio, artigo.extract || 'Resumo em texto indisponível.');

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
            if (saintInput) buscarWikipedia(saintInput.value);
        });
    }

    if (saintInput) {
        saintInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') buscarWikipedia(saintInput.value);
        });
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const nome = chip.getAttribute('data-name');
            if (saintInput) saintInput.value = nome;
            buscarWikipedia(nome);
        });
    });
});
