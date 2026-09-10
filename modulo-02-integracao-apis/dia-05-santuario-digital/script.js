async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Validando no banco de dados hagiográfico...');
    if (saintCard) saintCard.classList.add('hidden');

    // Padrões de categoria que indicam santidade/beatificação reconhecida
    const PADROES_SANTO = [
        /\bsantos?\s+(d[aeo]|dos|das)\b/i,      // "Santos da Argélia", "Santo do Império..."
        /\bsantas?\s+(d[aeo]|dos|das)\b/i,      // "Santas de Portugal"
        /\bbeatos?\s+(d[aeo]|dos|das)\b/i,      // "Beatos da Itália"
        /\bbeatas?\s+(d[aeo]|dos|das)\b/i,
        /doutores? da igreja/i,
        /padres? da igreja/i,
        /^papas\b/i,
        /m[aá]rtires? (católicos|cristãos)/i,
        /canoniza[çc][õo]es/i,
        /beatifica[çc][õo]es/i,
        /venera[çc][ãa]o cat[óo]lica/i
    ];

    function ehSanto(categorias) {
        if (!categorias || categorias.length === 0) return false;
        const cats = categorias.map(c => c.title.replace(/^Categoria:/i, ''));
        return cats.some(c => PADROES_SANTO.some(padrao => padrao.test(c)));
    }

    async function buscarCategoriasCompletas(titulo) {
        let categorias = [];
        let clcontinue = null;
        let pageBase = null;

        do {
            let url = `https://pt.wikipedia.org/w/api.php?action=query&prop=categories|extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=500&titles=${encodeURIComponent(titulo)}&format=json&origin=*`;
            if (clcontinue) url += `&clcontinue=${encodeURIComponent(clcontinue)}`;

            const res = await fetch(url);
            const data = await res.json();
            const page = Object.values(data.query.pages)[0];

            if (!pageBase) pageBase = page;
            if (page?.categories) categorias = categorias.concat(page.categories);

            clcontinue = data.continue?.clcontinue || null;
        } while (clcontinue);

        if (pageBase) pageBase.categories = categorias;
        return pageBase;
    }

    try {
        let queryBusca = termo;
        const termoLower = termo.toLowerCase();
        if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
            queryBusca = `Santo ${termo}`;
        }

        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        console.log('[DEBUG] Candidatos:', searchData.query?.search?.map(c => c.title));

        const candidatos = searchData.query?.search?.slice(0, 6) || [];

        for (const cand of candidatos) {
            const page = await buscarCategoriasCompletas(cand.title);
            console.log(`[DEBUG] Categorias de "${cand.title}":`, page?.categories?.map(c => c.title));

            if (page && ehSanto(page