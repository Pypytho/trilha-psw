async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Pesquisando na biblioteca de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // Busca com foco hagiográfico
        const consultas = [
            `São ${termo}`,
            `Santo ${termo}`,
            `Santa ${termo}`,
            `${termo} (santo)`,
            `${termo} (santa)`,
            termo
        ];

        let artigoEncontrado = null;

        // Palavras estritamente proibidas no TÍTULO ou no EXTRATO
        const palavrasProibidasNoTitulo = [
            'futebol', 'clube', 'fc', 'esporte', 'associação', 'município', 
            'apresentador', 'empresário', 'televisão', 'série', 'hospital', 
            'estádio', 'universidade', 'rodovia', 'desambiguação'
        ];

        const termosReligiosos = [
            'santos', 'santas', 'mártires', 'papas', 'beatos', 'beatas',
            'canonizados', 'místicos', 'místicas', 'religiosos', 'bispos', 'frades',
            'freiras', 'teólogos', 'doutores da igreja'
        ];

        for (const query of consultas) {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) continue;

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) continue;

            for (const item of searchData.query.search.slice(0, 5)) {
                const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=100&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const summaryResponse = await fetch(summaryUrl);
                if (!summaryResponse.ok) continue;

                const summaryData = await summaryResponse.json();
                const pages = summaryData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const tituloLower = artigo.title.toLowerCase();
                const extractLower = (artigo.extract || '').toLowerCase();

                // 1. CHECAGEM RÁPIDA DE TÍTULO (BLOQUEIO DIRETO)
                // Se o próprio TÍTULO da página tiver "futebol", "clube", etc., ignora sem dó
                const tituloEhProibido = palavrasProibidasNoTitulo.some(p => tituloLower.includes(p));
                if (tituloEhProibido) {
                    continue; 
                }

                // Extrai categorias
                const arrayCategorias = artigo.categories ? artigo.categories.map(c => c.title.toLowerCase()) : [];
                const textoCategorias = arrayCategorias.join(' ');

                // 2. CHECAGEM DE CATEGORIAS PROIBIDAS
                const categoriaEhProibida = palavrasProibidasNoTitulo.some(p => textoCategorias.includes(p));
                if (categoriaEhProibida) {
                    continue;
                }

                // 3. CHECAGEM DE VALIDADE SAGRADA (Somente se passou longe dos filtros)
                const ehSantoPorCategoria = termosReligiosos.some(termoSacro => textoCategorias.includes(termoSacro));
                
                const ehSantoPorTitulo = 
                    tituloLower.startsWith('santo ') || 
                    tituloLower.startsWith('santa ') || 
                    tituloLower.startsWith('são ') || 
                    tituloLower.includes('(santo)') || 
                    tituloLower.includes('(santa)');

                const ehSantoPorTexto = (
                    extractLower.includes('canonizad') || 
                    extractLower.includes('beatificad') || 
                    extractLower.includes('mártir') || 
                    extractLower.includes('igreja católica') ||
                    extractLower.includes('festa litúrgica')
                );

                if (ehSantoPorCategoria || ehSantoPorTitulo || ehSantoPorTexto) {
                    artigoEncontrado = artigo;
                    break;
                }
            }

            if (artigoEncontrado) break;
        }

        if (!artigoEncontrado) {
            throw new Error(`Nenhum santo ou santa encontrado para "${termo}". Digite o nome de uma figura de santidade (ex: Rita, Judas, Francisco).`);
        }

        // Renderização dos dados
        setTexto(saintName, artigoEncontrado.title);
        setTexto(saintBio, artigoEncontrado.extract || 'Nenhum resumo disponível para este artigo.');

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
