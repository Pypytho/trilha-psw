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

    // PALAVRAS OBRIGATÓRIAS: O resumo DEVE conter pelo menos UMA destas palavras/expressões
    const TERMOS_SACROS_OBRIGATORIOS = [
        'canonizad', 'beatificad', 'mártir', 'doutor da igreja', 
        'santo católico', 'santa católica', 'festa litúrgica', 
        'venerado', 'venerada', 'virgem e mártir', 'papa da igreja católica',
        'bispo de', 'frade', 'freira', 'monge', 'padroeir'
    ];

    // PALAVRAS PROIBIDAS: Se o resumo contiver QUALQUER uma destas, é descartado imediatamente
    const TERMOS_SECULARES_PROIBIDOS = [
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
        setTexto(statusMessage, 'Pesquisando e validando no acervo...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();

            // 1. CHECAGEM 1: Monta a query para priorizar o artigo do Santo
            let queryBusca = termo;
            if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
                queryBusca = `Santo ${termo}`;
            }

            // Busca os 5 artigos mais relevantes da Wikipédia para essa query
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryBusca)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) throw new Error(`Falha de conexão com a Wikipédia.`);

            const searchData = await searchResponse.json();
            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                throw new Error(`Nenhum resultado encontrado para "${termo}".`);
            }

            const resultados = searchData.query.search.slice(0, 5);
            let artigoAprovado = null;

            // 2. CHECAGEM 2: Analisa o texto do resumo de cada artigo encontrado
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

                // TESTE A: Verificação Anti-Falso-Positivo (Se for time, física, Einstein, etc., BLOQUEIA)
                const ehSecular = TERMOS_SECULARES_PROIBIDOS.some(termoProibido => 
                    tituloLower.includes(termoProibido) || extractLower.includes(termoProibido)
                );

                if (ehSecular) {
                    continue; // Pula para o próximo resultado sem aprovar
                }

                // TESTE B: Verificação de Santidade Real
                const ehSantoVerdadeiro = TERMOS_SACROS_OBRIGATORIOS.some(termoSacro => 
                    extractLower.includes(termoSacro)
                ) || (
                    (tituloLower.startsWith('são ') || tituloLower.startsWith('santo ') || tituloLower.startsWith('santa ')) &&
                    (extractLower.includes('igreja') || extractLower.includes('católic') || extractLower.includes('cristã'))
                );

                // Se passou nos dois testes da Checagem 2, o artigo está validado!
                if (ehSantoVerdadeiro) {
                    artigoAprovado = artigo;
                    break;
                }
            }

            // Se nenhum dos 5 resultados passou no filtro rigoroso
            if (!artigoAprovado) {
                throw new Error(`"${termo}" não foi identificado como um Santo ou Santa no acervo.`);
            }

            // 3. RENDERIZAÇÃO: Exibe o card aprovado
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
