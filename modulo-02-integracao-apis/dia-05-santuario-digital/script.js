// Referências aos elementos do DOM
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

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    setTexto(statusMessage, 'Pesquisando no acervo de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // ETAPA 1: Busca os artigos mais relevantes na Wikipedia acrescentando "Santo" à consulta para ranqueamento
        const consultaTratada = `Santo ${termoBusca.trim()}`;
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(consultaTratada)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) throw new Error(`Erro na conexão (Status: ${searchResponse.status})`);

        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum resultado encontrado para "${termoBusca}".`);
        }

        // Analisa os primeiros 5 resultados da pesquisa para encontrar um que seja REALMENTE um Santo/Santa
        const resultados = searchData.query.search;
        let artigoValido = null;
        let dadosArtigo = null;

        for (const item of resultados) {
            // ETAPA 2: Requisita o resumo, imagem E as categorias da página
            const summaryUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=original&inprop=url&cllimit=50&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
            
            const summaryResponse = await fetch(summaryUrl);
            if (!summaryResponse.ok) continue;

            const summaryData = await summaryResponse.json();
            const pages = summaryData.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") continue;

            const artigo = pages[pageId];
            const categorias = artigo.categories ? artigo.categories.map(c => c.title.toLowerCase()) : [];

            // Validação estrita por Categoria ou Título
            const ehSantoPorCategoria = categorias.some(cat => 
                cat.includes('santos') || 
                cat.includes('santas') || 
                cat.includes('mártires') || 
                cat.includes('papas') || 
                cat.includes('beatos') || 
                cat.includes('místicos')
            );

            const tituloLower = artigo.title.toLowerCase();
            const ehSantoPorTitulo = tituloLower.startsWith('santo ') || 
                                     tituloLower.startsWith('santa ') || 
                                     tituloLower.startsWith('são ') || 
                                     tituloLower.includes(' (santo)') || 
                                     tituloLower.includes(' (santa)');

            if (ehSantoPorCategoria || ehSantoPorTitulo) {
                artigoValido = artigo;
                dadosArtigo = artigo;
                break; // Achou o santo correto! Sai do loop.
            }
        }

        // Se nenhum dos resultados for um Santo ou Santa
        if (!dadosArtigo) {
            throw new Error(`O termo "${termoBusca}" não corresponde a um Santo ou Santa reconhecido na Wikipedia.`);
        }

        // ETAPA 3: Renderiza os dados validados no DOM
        setTexto(saintName, dadosArtigo.title);
        setTexto(saintBio, dadosArtigo.extract || 'Nenhum resumo em texto disponível para este artigo.');

        if (saintImg) {
            if (dadosArtigo.original && dadosArtigo.original.source) {
                saintImg.src = dadosArtigo.original.source;
                saintImg.style.display = 'block';
            } else {
                saintImg.style.display = 'none';
            }
        }

        if (saintLink && dadosArtigo.fullurl) {
            saintLink.href = dadosArtigo.fullurl;
        }

        setTexto(statusMessage, '');
        if (saintCard) saintCard.classList.remove('hidden');

    } catch (erro) {
        setTexto(statusMessage, `[Filtro de Segurança]: ${erro.message}`);
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
