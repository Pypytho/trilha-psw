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

            // Query SPARQL para buscar APENAS santos católicos canonizados
            // P425 = canonization date (tem que ter data de canonização)
            // P6129 = religion (tem que ser catolicismo)
            // P580 = start time (para evitar papas futuros)
            const sparqlQuery = `
                SELECT ?item ?itemLabel ?canonizationDate ?article WHERE {
                  ?item wdt:P425 ?canonizationDate .
                  ?item wdt:P6129 wd:Q9592 .
                  ?item wdt:P31 wd:Q5 .
                  ?article schema:about ?item ;
                           schema:isPartOf <https://pt.wikipedia.org/> .
                  FILTER(CONTAINS(LCASE(?itemLabel), "${termoLower}"))
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
                } ORDER BY ?canonizationDate
            `;

            const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
            
            const wikiResponse = await fetch(wikidataUrl, {
                headers: { 'Accept': 'application/sparql-results+json' }
            });

            if (!wikiResponse.ok) {
                throw new Error('Erro ao conectar com Wikidata');
            }

            const wikiData = await wikiResponse.json();
            const bindings = wikiData.results?.bindings || [];

            if (bindings.length === 0) {
                throw new Error(`"${termo}" não é um Santo ou Santa canonizado pela Igreja Católica.`);
            }

            // Se houver múltiplos resultados com o mesmo nome, pega o primeiro
            // (o mais antigo canonizado, ordenado pela query)
            const primeiroResultado = bindings[0];
            const nomeSanto = primeiroResultado.itemLabel.value;

            // Busca os detalhes completos na Wikipedia
            const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(nomeSanto)}&format=json&origin=*`;
            
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();
            const pages = Object.values(detailsData.query.pages);

            if (pages.length === 0) {
                throw new Error(`Página do Wikipedia não encontrada para ${nomeSanto}`);
            }

            const page = pages[0];

            // Valida se tem categorias de santo canonizado
            if (!page.categories) {
                throw new Error(`"${nomeSanto}" não possui categorias de santo canonizado.`);
            }

            const cats = page.categories.map(c => c.title.toLowerCase());
            const ehSantoCanonizado = cats.some(c => 
                c.includes('santos católicos') || 
                c.includes('santas católicas') ||
                c.includes('canonizados')
            );

            if (!ehSantoCanonizado) {
                throw new Error(`"${nomeSanto}" não é um Santo ou Santa canonizado.`);
            }

            renderizarPagina(page);
            setTexto(statusMessage, '');
            if (saintCard) saintCard.classList.remove('hidden');

        } catch (erro) {
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
