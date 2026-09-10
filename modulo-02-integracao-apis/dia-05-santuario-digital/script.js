// Coloque isto na topo do script.js para confirmar o carregamento no F12
console.log(">>> CÓDIGO NOVO CARREGADO COM SUCESSO <<<");

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

    // PALAVRAS-CHAVE EXCLUSIVAS DE CANONIZAÇÃO
    const TERMOS_CANONIZACAO = [
        'beatificad',      // beatificado, beatificada, beatificação
        'canonizad',      // canonizado, canonizada, canonização
        'papa da igreja', 
        'santo católico', 
        'santa católica', 
        'doutor da igreja', 
        'doutora da igreja',
        'mártir católic',
        'festa litúrgica'
    ];

    // TERMOS QUE CANCELAM O RESULTADO INSTANTANEAMENTE
    const TERMOS_PROIBIDOS = [
        'futebol', 'clube', 'esporte', 'estádio', 'município', 'prefeitura',
        'físico', 'nobel', 'física', 'cientista', 'relatividade', 'televisão',
        'campeonato', 'associação atlética', 'empresa', 'político', 'deputado'
    ];

    async function buscarSantoWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Pesquisando no acervo...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();

            // 1. PRIMEIRA CHECAGEM: Força a busca hagiográfica se o usuário não digitou o prefixo
            let queryBusca = termo;
            if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
                queryBusca = `Santo ${termo}`;
            }

            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) throw new Error(`Falha de conexão com a Wikipédia.`);

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhum resultado encontrado para "${termo}".`);
            }

            const resultados = searchData.query.search.slice(0, 5);
            let artigoAprovado = null;

            // 2. SEGUNDA CHECAGEM: Validação estrita do texto da página
            for (const item of resultados) {
                const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
                const summaryResponse = await fetch(summaryUrl);
                if (!summaryResponse.ok) continue;

                const summaryData = await summaryResponse.json();
                const pages = summaryData.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId === "-1") continue;

                const artigo = pages[pageId];
                const tituloLower = artigo.title.toLowerCase();
                const extractLower = (artigo.extract || '').toLowerCase();

                // Checagem Anti-Falso-Positivo
                const ehSecular = TERMOS_PROIBIDOS.some(proibido => 
                    tituloLower.includes(proibido) || extractLower.includes(proibido)
                );

                if (ehSecular) continue;

                // Checagem Obrigatoria de Canonização / Papa / Beatificado
                const ehValidoPorCanonizacao = TERMOS_CANONIZACAO.some(termoSacro => 
                    extractLower.includes(termoSacro)
                );

                if (ehValidoPorCanonizacao) {
                    artigoAprovado = artigo;
                    break;
                }
            }

            if (!artigoAprovado) {
                throw new Error(`"${termo}" não foi validado como Santo, Papa ou figura beatificada no acervo.`);
            }

            // 3. RENDERIZAÇÃO
            setTexto(saintName, artigoAprovado.title);
            setTexto(saintBio, artigoAprovado.extract || 'Resumo não disponível.');

            if (saintImg) {
                if (artigoAprovado.original && artigoAprovado.original.source) {
                    saintImg.src = artigoAprovado.original.source;
                    saintImg.style.display = 'block';
                } else {
                    saintImg.style.display = 'none';
                }
            }

            if (saintLink && artigoAprovado.fullurl) {
                saintLink.href = artigoAprovado.fullurl;
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
