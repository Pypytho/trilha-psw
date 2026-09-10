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

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Pesquisando na biblioteca de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // Pesquisa na Wikipedia buscando exatamente pelo nome digitado
        const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) throw new Error(`Erro de conexão (Status: ${searchResponse.status})`);

        const searchData = await searchResponse.json();
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            throw new Error(`Nenhum resultado encontrado para "${termo}".`);
        }

        // Analisa os primeiros resultados retornados pela Wikipedia
        const resultados = searchData.query.search.slice(0, 5);
        let artigoValido = null;

        // Palavras obrigatórias no contexto católico/sagrado
        const palavrasObrigatorias = [
            'católic', 'canonizad', 'beatificad', 'mártir', 'virgem',
            'litúrgic', 'hagiograf', 'doutor da igreja', 'santa sé',
            'igreja católica', 'festa litúrgica'
        ];

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

            // BLOQUEIO DIRETO: Se o título contiver clube, futebol ou cidade
            if (tituloLower.includes('futebol') || tituloLower.includes('clube') || tituloLower.includes('município')) {
                continue;
            }

            // REGRA PRINCIPAL: O resumo da página TEM QUE conter pelo menos uma palavra católica/sagrada
            const ehCatolicoOuSanto = palavrasObrigatorias.some(palavra => extractLower.includes(palavra));

            // Além disso, aceita se o título começar explicitamente com São, Santo ou Santa
            const ehTituloDeSanto = tituloLower.startsWith('santo ') || 
                                    tituloLower.startsWith('santa ') || 
                                    tituloLower.startsWith('são ') || 
                                    tituloLower.includes('(santo)') || 
                                    tituloLower.includes('(santa)');

            if (ehCatolicoOuSanto || ehTituloDeSanto) {
                artigoValido = artigo;
                break; // Achou um Santo/Santa legítimo!
            }
        }

        // Se nenhum dos resultados for um Santo ou Santa
        if (!artigoValido) {
            throw new Error(`"${termo}" não é um Santo ou Santa católico reconhecido na Wikipedia.`);
        }

        // Exibe os dados do Santo validado na tela
        setTexto(saintName, artigoValido.title);
        setTexto(saintBio, artigoValido.extract || 'Nenhum resumo em texto disponível para este artigo.');

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
