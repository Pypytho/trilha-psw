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

    // Função para validar se é realmente um santo canonizado
    async function validarSanto(titulo) {
        try {
            const catUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=categories|extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&titles=${encodeURIComponent(titulo)}`;
            const catRes = await fetch(catUrl);
            const catData = await catRes.json();
            const page = Object.values(catData.query.pages)[0];

            if (!page || !page.categories) {
                return null;
            }

            const cats = page.categories.map(c => c.title.toLowerCase());
            
            // Verifica categorias de santo canonizado ou reconhecido
            const ehSanto = cats.some(c => 
                c.includes('santos católicos') || 
                c.includes('santas católicas') || 
                c.includes('doutores da igreja') || 
                c.includes('beatos católicos') || 
                c.includes('beatas católicas') ||
                c.includes('papas') ||
                c.includes('santo') && c.includes('canonizado') ||
                c.includes('santa') && c.includes('canonizado')
            );

            if (ehSanto) {
                return page;
            }
            
            return null;
        } catch (erro) {
            console.error('Erro ao validar santo:', erro);
            return null;
        }
    }

    async function buscarSantoWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Validando no banco de dados hagiográfico...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();
            let queryBusca = termo;

            if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
                queryBusca = `Santo ${termo}`;
            }

            // 1. Consulta SPARQL na Wikidata: Busca santos canonizados
            // Usa subclass of saint (P279 -> Q43115) que é mais inclusivo
            const sparqlQuery = `
                SELECT ?item ?itemLabel ?article WHERE {
                  ?item wdt:P31 wd:Q5 .
                  { ?item wdt:P279 wd:Q43115 . } UNION { ?item wdt:P39 wd:Q19516 . } UNION { ?item wdt:P1049 ?venerado . }
                  ?article schema:about ?item ;
                           schema:isPartOf <https://pt.wikipedia.org/> .
                  BIND(COALESCE(?article, ?itemLabel) AS ?name)
                  FILTER(CONTAINS(LCASE(?itemLabel), "${termoLower}"))
                } LIMIT 10
            `;

            const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
            const wikiResponse = await fetch(wikidataUrl, {
                headers: { 'Accept': 'application/sparql-results+json' }
            });

            let candidatoWikidata = null;

            if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json();
                const bindings = wikiData.results?.bindings;
                if (bindings && bindings.length > 0) {
                    // Tenta validar cada candidato da Wikidata
                    for (const binding of bindings) {
                        const nomeWikidata = binding.itemLabel?.value;
                        if (nomeWikidata) {
                            const paginaValidada = await validarSanto(nomeWikidata);
                            if (paginaValidada) {
                                renderizarPagina(paginaValidada);
                                setTexto(statusMessage, '');
                                if (saintCard) saintCard.classList.remove('hidden');
                                return;
                            }
                        }
                    }
                }
            }

            // 2. Fallback: Busca normal na Wikipedia e valida estritamente
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.query?.search?.length > 0) {
                const candidatos = searchData.query.search.slice(0, 10);

                for (const cand of candidatos) {
                    const paginaValidada = await validarSanto(cand.title);
                    if (paginaValidada) {
                        renderizarPagina(paginaValidada);
                        setTexto(statusMessage, '');
                        if (saintCard) saintCard.classList.remove('hidden');
                        return;
                    }
                }
            }

            throw new Error(`"${termo}" não é um Santo, Santa ou Beato católico reconhecido.`);

        } catch (erro) {
            setTexto(statusMessage, `[Aviso]: ${erro.message}`);
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
