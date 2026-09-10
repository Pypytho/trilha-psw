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

    // Lista de categorias oficiais da Wikipédia dedicadas exclusivamente a figuras veneradas
    const CATEGORIAS_SANTOS = [
        'Santos católicos',
        'Santas católicas',
        'Doutores da Igreja',
        'Beatos católicos',
        'Beatas católicas',
        'Papas'
    ];

    async function buscarSantoWikipedia(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
            return;
        }

        const termo = termoBusca.trim();
        setTexto(statusMessage, 'Consultando o acervo oficial de santos...');
        if (saintCard) saintCard.classList.add('hidden');

        try {
            const termoLower = termo.toLowerCase();
            let artigoEncontrado = null;

            // 1. Busca restrita: consulta diretamente os artigos indexados nas categorias religiosas
            for (const categoria of CATEGORIAS_SANTOS) {
                // A API gcmsearch busca termos APENAS dentro dos membros da categoria especificada
                const categoryUrl = `https://pt.wikipedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Categoria:${encodeURIComponent(categoria)}&gcmlimit=500&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&format=json&origin=*`;
                
                const response = await fetch(categoryUrl);
                if (!response.ok) continue;

                const data = await response.json();

                if (data.query && data.query.pages) {
                    const paginas = Object.values(data.query.pages);

                    // Procura na lista de membros da categoria por um título que dê "match" com a busca
                    const correspondencia = paginas.find(pagina => {
                        const tituloLower = pagina.title.toLowerCase();
                        return tituloLower.includes(termoLower);
                    });

                    if (correspondencia) {
                        artigoEncontrado = correspondencia;
                        break; // Achou dentro da categoria religiosa! Interrompe a busca.
                    }
                }
            }

            // 2. Fallback inteligente: se a pessoa buscou por um nome específico (ex: "Agostinho" ou "Rita")
            // que está numa subcategoria mais profunda, fazemos uma busca direcionada por prefixo religioso
            if (!artigoEncontrado) {
                let queryComPrefixo = termo;
                if (!termoLower.startsWith('são ') && !termoLower.startsWith('santo ') && !termoLower.startsWith('santa ') && !termoLower.startsWith('beato ') && !termoLower.startsWith('beata ')) {
                    queryComPrefixo = `Santo ${termo}`;
                }

                // Busca o artigo e valida se a página pertence estritamente a uma categoria de santidade
                const directUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&titles=${encodeURIComponent(queryComPrefixo)}&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&format=json&origin=*`;
                
                const responseDirect = await fetch(directUrl);
                if (responseDirect.ok) {
                    const dataDirect = await responseDirect.json();
                    if (dataDirect.query && dataDirect.query.pages) {
                        const pageId = Object.keys(dataDirect.query.pages)[0];
                        if (pageId !== "-1") {
                            const pagina = dataDirect.query.pages[pageId];
                            const categorias = pagina.categories ? pagina.categories.map(c => c.title) : [];

                            // Validação estrita por categoria
                            const pertenceAosSantos = categorias.some(cat => 
                                CATEGORIAS_SANTOS.some(catOficial => cat.includes(catOficial)) ||
                                cat.includes('Santos') || 
                                cat.includes('Santas') || 
                                cat.includes('Mártires católicos')
                            );

                            if (pertenceAosSantos) {
                                artigoEncontrado = pagina;
                            }
                        }
                    }
                }
            }

            // 3. Se não passou na checagem de categoria, rejeita
            if (!artigoEncontrado) {
                throw new Error(`"${termo}" não consta no acervo de Santos e Santas Católicos.`);
            }

            // 4. Renderização do resultado aprovado
            setTexto(saintName, artigoEncontrado.title);
            setTexto(saintBio, artigoEncontrado.extract || 'Resumo em texto indisponível.');

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
