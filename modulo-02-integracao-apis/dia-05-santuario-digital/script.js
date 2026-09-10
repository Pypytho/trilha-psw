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

    // Categorias Oficiais e Específicas da Wikipédia que definem uma figura canonizada/venerada
    const CATEGORIAS_RELIGIOSAS_ESTRITAS = [
        'santos católicos',
        'santas católicas',
        'santos da',
        'santas da',
        'santos do',
        'santas do',
        'santos de',
        'santas de',
        'papas',
        'beatos católicos',
        'beatas católicas',
        'doutores da igreja',
        'mártires católicos',
        'santos canonizados'
    ];

    // Termos que FORÇAM o descarte imediato (futebol, geografia, ciência secular, etc.)
    const TERMOS_DESCARTE = [
        'futebol', 'clube', 'esporte', 'estádio', 'município', 'estado do brasil', 
        'prefeitura', 'físico', 'nobel', 'física', 'cientista', 'televisão', 
        'associação', 'campeonato', 'empresa', 'político'
    ];

    async function buscarSantoWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Pesquisando no acervo de santos e santas...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();

            // Para otimizar a busca na Wikipédia e não trazer seculares primeiro, 
            // prefixamos "Santo " se a pessoa digitou apenas o nome (ex: "Agostinho" -> "Santo Agostinho")
            let queryPesquisa = termo;
            if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
                queryPesquisa = `Santo ${termo}`;
            }

            // 1. Busca os 5 artigos mais relevantes na Wikipédia
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryPesquisa)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) throw new Error(`Falha de conexão com a Wikipedia.`);

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhum artigo encontrado para "${termo}".`);
            }

            const resultados = searchData.query.search.slice(0, 5);
            let artigoEncontrado = null;

            for (const item of resultados) {
                // 2. Para cada artigo, busca os dados e as CATEGORIAS oficiais indexadas na Wikipédia
                const detailsUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=100&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const detailsResponse = await fetch(detailsUrl);
                if (!detailsResponse.ok) continue;

                const detailsData = await detailsResponse.json();
                const pages = detailsData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const tituloLower = artigo.title.toLowerCase();

                // Extrai o nome de todas as categorias do artigo
                const categorias = artigo.categories 
                    ? artigo.categories.map(c => c.title.toLowerCase()) 
                    : [];

                // FILTRO 1: Descarte imediato se contiver qualquer termo secular proibido no título ou categorias
                const ehSecularOuEsporte = TERMOS_DESCARTE.some(t => 
                    tituloLower.includes(t) || categorias.some(c => c.includes(t))
                );

                if (ehSecularOuEsporte) {
                    continue; // Pula Einstein, clubes, cidades, etc.
                }

                // FILTRO 2: Validação estrita por categoria de santidade
                // Checa se pelo menos UMA das categorias do artigo bate com as categorias de santos católicos
                const ehSantoEstrito = categorias.some(cat => 
                    CATEGORIAS_RELIGIOSAS_ESTRITAS.some(regra => cat.includes(regra))
                );

                // Validação secundária: se o título começar explicitamente com São, Santo ou Santa
                // E NÃO for desambiguação
                const ehSantoPorTitulo = (tituloLower.startsWith('são ') || tituloLower.startsWith('santo ') || tituloLower.startsWith('santa ')) && 
                                         !tituloLower.includes('desambiguação');

                if (ehSantoEstrito || ehSantoPorTitulo) {
                    artigoEncontrado = artigo;
                    break; // Artigo legítimo de Santo Católico encontrado!
                }
            }

            if (!artigoEncontrado) {
                throw new Error(`"${termo}" não corresponde a um Santo, Santa ou figura canonizada reconhecida.`);
            }

            // 3. Renderização
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
