async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Validando no banco de dados hagiográfico...');
    if (saintCard) saintCard.classList.add('hidden');

    // Palavras-chave que indicam santidade/beatificação reconhecida pela Igreja Católica
    const PALAVRAS_CHAVE_SANTO = [
        'santos católicos',
        'santas católicas',
        'santos cristãos',
        'doutores da igreja',
        'beatos católicos',
        'beatas católicas',
        'papas',
        'veneração católica',
        'canonizações',
        'canonizados',
        'beatificados',
        'mártires cristãos',
        'mártires católicos',
        'fundadores de ordens religiosas católicas'
    ];

    function ehSanto(categorias) {
        if (!categorias || categorias.length === 0) return false;
        const cats = categorias.map(c => c.title.toLowerCase());
        return cats.some(c => PALAVRAS_CHAVE_SANTO.some(chave => c.includes(chave)));
    }

    // Busca todas as categorias de uma página, paginando se necessário
    async function buscarTodasCategorias(titulo) {
        let categorias = [];
        let clcontinue = null;

        do {
            let url = `https://pt.wikipedia.org/w/api.php?action=query&prop=categories|extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=500&titles=${encodeURIComponent(titulo)}&format=json&origin=*`;
            if (clcontinue) url += `&clcontinue=${encodeURIComponent(clcontinue)}`;

            const res = await fetch(url);
            const data = await res.json();
            const page = Object.values(data.query.pages)[0];

            if (page?.categories) categorias = categorias.concat(page.categories);
            if (categorias.length === 0 && page) {
                // guarda o objeto page completo pra usar depois (extrato, imagem etc.)
                buscarTodasCategorias.ultimaPage = page;
            } else if (page) {
                buscarTodasCategorias.ultimaPage = { ...page, categories: categorias };
            }

            clcontinue = data.continue?.clcontinue || null;
        } while (clcontinue);

        return buscarTodasCategorias.ultimaPage;
    }

    try {
        let queryBusca = termo;
        const termoLower = termo.toLowerCase();
        if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
            queryBusca = `Santo ${termo}`;
        }

        // Busca candidatos na Wikipedia (tenta o termo original e a versão com "Santo/a")
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        console.log('[DEBUG] Candidatos encontrados:', searchData.query?.search?.map(c => c.title));

        const candidatos = searchData.query?.search?.slice(0, 6) || [];

        for (const cand of candidatos) {
            const page = await buscarTodasCategorias(cand.title);
            console.log(`[DEBUG] Categorias de "${cand.title}":`, page?.categories?.map(c => c.title));

            if (page && ehSanto(page.categories)) {
                renderizarPagina(page);
                setTexto(statusMessage, '');
                if (saintCard) saintCard.classList.remove('hidden');
                return;
            }
        }

        throw new Error(`"${termo}" não é um Santo, Santa ou Beato católico reconhecido.`);

    } catch (erro) {
        console.error('[DEBUG] Erro na busca:', erro);
        setTexto(statusMessage, `[Aviso]: ${erro.message}`);
    }
}