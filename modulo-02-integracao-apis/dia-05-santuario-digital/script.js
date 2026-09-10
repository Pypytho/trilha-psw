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

            // Primeira tentativa: Query SPARQL estrita com data de canonização
            const sparqlQuery = `
                SELECT ?item ?itemLabel ?canonizationDate ?article WHERE {
                  ?item wdt:P425 ?canonizationDate .
                  ?item wdt:P6129 wd:Q9592 .
                  ?item wdt:P31 wd:Q5 .
                  ?article schema:about ?item ;
                           schema:isPartOf <https://pt.wikipedia.org/> .
                  FILTER(CONTAINS(LCASE(?itemLabel), "${termoLower}"))
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
                } LIMIT 10
            `;

            console.log("Query SPARQL:", sparqlQuery);

            const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
            
            const wikiResponse = await fetch(wikidataUrl, {
                headers: { 'Accept': 'application/sparql-results+json' }
            });

            if (!wikiResponse.ok) {
                throw new Error('Erro ao conectar com Wikidata');
            }

            const wikiData = await wikiResponse.json();
            console.log("Resposta Wikidata (com P425):", wikiData);
            
            let bindings = wikiData.results?.bindings || [];

            // Se não encontrou com P425 (data de canonização), tenta busca mais ampla
            if (bindings.length === 0) {
                console.log("Nenhum resultado com P425, tentando busca ampla...");
                
                const sparqlQueryAmpla = `
                    SELECT ?item ?itemLabel ?article WHERE {
                      ?item wdt:P31 wd:Q5 .
                      ?item wdt:P6129 wd:Q9592 .
                      ?article schema:about ?item ;
                               schema:isPartOf <https://pt.wikipedia.org/> .
                      FILTER(CONTAINS(LCASE(?itemLabel), "${termoLower}"))
                      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
                    } LIMIT 10
                `;

                const wikidataUrlAmpla = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQueryAmpla)}&format=json`;
                const wikiResponseAmpla = await fetch(wikidataUrlAmpla, {
                    headers: { 'Accept': 'application/sparql-results+json' }
                });

                const wikiDataAmpla = await wikiResponseAmpla.json();
                console.log("Resposta Wikidata (ampla):", wikiDataAmpla);
                bindings = wikiDataAmpla.results?.bindings || [];
            }

            if (bindings.length === 0) {
                throw new Error(`"${termo}" não é um Santo ou Santa canonizado pela Igreja Católica.`);
            }

            // Pega o primeiro resultado
            const primeiroResultado = bindings[0];
            const nomeSanto = primeiroResultado.itemLabel.value;
            console.log("Santo encontrado:", nomeSanto);

            // Busca os detalhes completos na Wikipedia
            const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&titles=${encodeURIComponent(nomeSanto)}&format=json&origin=*`;
            
            console.log("Buscando detalhes Wikipedia:", nomeSanto);
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();
            const pages = Object.values(detailsData.query.pages);

            console.log("Páginas encontradas:", pages);

            if (pages.length === 0 || pages[0].missing) {
                throw new Error(`Página do Wikipedia não encontrada para ${nomeSanto}`);
            }

            const page = pages[0];
            console.log("Categorias da página:", page.categories);

            // Valida se tem categorias de santo canonizado
            if (page.categories && page.categories.length > 0) {
                const cats = page.categories.map(c => c.title.toLowerCase());
                console.log("Categorias em lowercase:", cats);
                
                const ehSanto = cats.some(c => 
                    c.includes('santo') || 
                    c.includes('santa') || 
                    c.includes('canonizado') ||
                    c.includes('beato') ||
                    c.includes('beata')
                );

                if (!ehSanto) {
                    console.warn("Não encontrou categorias de santo");
                }
            }

            renderizarPagina(page);
            setTexto(statusMessage, '');
            if (saintCard) saintCard.classList.remove('hidden');

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
