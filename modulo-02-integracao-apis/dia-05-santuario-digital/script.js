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

        // 1. Consulta SPARQL na Wikidata
        const sparqlQuery = `
            SELECT ?item ?itemLabel ?article WHERE {
              ?item wdt:P31 wd:Q5 . 
              { ?item wdt:P411 ?santo . } UNION { ?item wdt:P1049 ?venerado . } UNION { ?item wdt:P39 wd:Q19516 . }
              ?article schema:about ?item ;
                       schema:isPartOf <https://pt.wikipedia.org/> ;
                       schema:name ?itemLabel .
              FILTER(CONTAINS(LCASE(?itemLabel), "${termoLower}") || CONTAINS(LCASE(?itemLabel), "${queryBusca.toLowerCase()}"))
            } LIMIT 1
        `;

        const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
        const wikiResponse = await fetch(wikidataUrl, {
            headers: { 'Accept': 'application/sparql-results+json' }
        });

        let tituloArtigoWikipedia = null;

        if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            const bindings = wikiData.results?.bindings;
            if (bindings && bindings.length > 0) {
                tituloArtigoWikipedia = bindings[0].itemLabel.value;
            }
        }

        // 2. Se encontrou via SPARQL, valida as categorias ANTES de exibir
        if (tituloArtigoWikipedia) {
            const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=10&titles=${encodeURIComponent(tituloArtigoWikipedia)}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();
            const page = Object.values(detailsData.query.pages)[0];

            // VALIDAÇÃO: Verifica se tem categorias de santo
            if (page && page.categories) {
                const cats = page.categories.map(c => c.title.toLowerCase());
                const ehSantoCatolicidade = cats.some(c => 
                    c.includes('santos católicos') || 
                    c.includes('santas católicas') || 
                    c.includes('doutores da igreja') || 
                    c.includes('beatos católicos') || 
                    c.includes('beatas católicas') ||
                    c.includes('papas')
                );

                if (!ehSantoCatolicidade) {
                    throw new Error(`"${termo}" não é um Santo, Santa ou Beato católico reconhecido.`);
                }

                renderizarPagina(page);
                setTexto(statusMessage, '');
                if (saintCard) saintCard.classList.remove('hidden');
                return;
            }
        }

        // 3. Fallback: Busca normal e valida
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.query?.search?.length > 0) {
            const candidatos = searchData.query.search.slice(0, 5);

            for (const cand of candidatos) {
                const catUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=categories|extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=10&titles=${encodeURIComponent(cand.title)}`;
                const catRes = await fetch(catUrl);
                const catData = await catRes.json();
                const page = Object.values(catData.query.pages)[0];

                if (page && page.categories) {
                    const cats = page.categories.map(c => c.title.toLowerCase());
                    const ehSantoCatolicidade = cats.some(c => 
                        c.includes('santos católicos') || 
                        c.includes('santas católicas') || 
                        c.includes('doutores da igreja') || 
                        c.includes('beatos católicos') || 
                        c.includes('beatas católicas') ||
                        c.includes('papas')
                    );

                    if (ehSantoCatolicidade) {
                        renderizarPagina(page);
                        setTexto(statusMessage, '');
                        if (saintCard) saintCard.classList.remove('hidden');
                        return;
                    }
                }
            }
        }

        throw new Error(`"${termo}" não é um Santo, Santa ou Beato católico reconhecido.`);

    } catch (erro) {
        setTexto(statusMessage, `[Aviso]: ${erro.message}`);
    }
}