console.log(">>> CÓDIGO FINAL CALIBRADO CARREGADO <<<");

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

    // 1. TERMOS SACROS AMPLIADOS (O artigo DEVE ter pelo menos um destes no resumo)
    const TERMOS_SACROS = [
        'canonizad', 'beatificad', 'papa', 'doutor da igreja', 'doutora da igreja',
        'mártir', 'santo católico', 'santa católica', 'venerad', 'padroeir', 
        'religioso', 'religiosa', 'cristã', 'católic', 'igreja', 'bispo', 'frei', 
        'freira', 'monge', 'monja', 'místico', 'mística', 'franciscan', 'beneditin',
        'dominican', 'jesuíta', 'virgem', 'festa litúrgica', 'santuário'
    ];

    // 2. BLOQUEIO INTRANSIGENTE (Se tiver QUALQUER um destes, é descartado na hora)
    const TERMOS_PROIBIDOS = [
        'futebol', 'clube', 'esporte', 'estádio', 'município', 'prefeitura',
        'físico', 'nobel', 'física', 'cientista', 'relatividade', 'televisão',
        'campeonato', 'associação atlética', 'empresa', 'político', 'deputado', 'álbum'
    ];

    async function buscarSantoWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Pesquisando e validando santo...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();

            // Formata a consulta para priorizar o título religioso na Wikipédia
            let queryBusca = termo;
            if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
                queryBusca = `Santo ${termo}`;
            }

            // Busca os 8 primeiros resultados para dar margem a nomes comuns
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) throw new Error(`Falha de conexão com a Wikipédia.`);

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhum resultado encontrado para "${termo}".`);
            }

            const resultados = searchData.query.search.slice(0, 8);
            let artigoAprovado = null;

            // Análise detalhada dos resumos
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

                // FILTRO A: Rejeição absoluta por termos seculares (Barra Einstein, futebol, etc.)
                const ehSecular = TERMOS_PROIBIDOS.some(proibido => 
                    tituloLower.includes(proibido) || extractLower.includes(proibido)
                );

                if (ehSecular) continue;

                // FILTRO B: Validação de Pertencimento Religioso/Sacro
                const possuiTermoSacro = TERMOS_SACROS.some(termoSacro => 
                    extractLower.includes(termoSacro)
                );

                // Deve conter um termo sacro E ter o prefixo no título ou no resumo
                const temNomeDeSanto = tituloLower.startsWith('são ') || 
                                       tituloLower.startsWith('santo ') || 
                                       tituloLower.startsWith('santa ') || 
                                       tituloLower.startsWith('beato ') || 
                                       tituloLower.startsWith('beata ') ||
                                       extractLower.includes('santo') ||
                                       extractLower.includes('santa');

                if (possuiTermoSacro && temNomeDeSanto) {
                    artigoAprovado = artigo;
                    break; // Encontrou o Santo!
                }
            }

            if (!artigoAprovado) {
                throw new Error(`"${termo}" não foi reconhecido como um Santo ou Santa católico validado.`);
            }

            // RENDERIZAÇÃO
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
