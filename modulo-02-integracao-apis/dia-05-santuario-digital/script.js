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

    // Termos que indicam se um título/categoria é estritamente religioso
    const PREFIXOS_SANTO = ['são ', 'santo ', 'santa ', 'beato ', 'beata '];

    async function buscarSantoWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Consultando o acervo de santos...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();

            // 1. Monta os termos de busca para localizar o artigo correto
            let buscaExata = termo;
            if (!PREFIXOS_SANTO.some(p => termoLower.startsWith(p))) {
                buscaExata = `Santo ${termo}`;
            }

            // 2. Busca na API focando apenas em categorias e páginas de Santos Católicos
            // Usamos a busca da MediaWiki restringindo o escopo com o namespace de artigos
            const endpointUrl = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(buscaExata)}&gsrnamespace=0&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&format=json&origin=*`;

            const response = await fetch(endpointUrl);
            if (!response.ok) throw new Error('Erro na conexão com a Wikipédia.');

            const data = await response.json();

            if (!data.query || !data.query.pages) {
                throw new Error(`Nenhum registro de santo encontrado para "${termo}".`);
            }

            const paginas = Object.values(data.query.pages);
            let artigoValido = null;

            // 3. Validação rígida: o artigo DEVE ter categoria explícita de santidade
            for (const pagina of paginas) {
                const tituloLower = pagina.title.toLowerCase();
                const categorias = pagina.categories ? pagina.categories.map(c => c.title.toLowerCase()) : [];

                // Verifica se tem categorias oficiais da Wikipedia para figuras canonizadas/veneradas
                const temCategoriaSanto = categorias.some(cat => 
                    cat.includes('santos') || 
                    cat.includes('santas') || 
                    cat.includes('beatos') || 
                    cat.includes('beatas') || 
                    cat.includes('papas') || 
                    cat.includes('doutores da igreja') ||
                    cat.includes('mártires católicos')
                );

                // Garante que o título não é uma página de desambiguação, cidade ou clube
                const ehDesambiguacaoOuSecular = tituloLower.includes('desambiguação') || 
                                                categorias.some(c => c.includes('futebol') || c.includes('municípios') || c.includes('físicos'));

                if (temCategoriaSanto && !ehDesambiguacaoOuSecular) {
                    artigoValido = pagina;
                    break;
                }
            }

            if (!artigoValido) {
                throw new Error(`"${termo}" não foi encontrado como Santo ou Santa no acervo.`);
            }

            // 4. Renderização dos dados validados
            setTexto(saintName, artigoValido.title);
            setTexto(saintBio, artigoValido.extract || 'Resumo não disponível.');

            if (saintImg) {
                if (artigoValido.original && artigoValido.original.source) {
                    saintImg.src = artigoValido.original.source;
                    saintImg.style.display = 'block';
                } else {
                    saintImg.style.display = 'none';
                }
            }

            if (saintLink && artigoValido.fullurl) {
                saintLink.href = artigoValido.fullurl;
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
