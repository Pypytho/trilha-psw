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

// Função assíncrona para buscar na API da Wikipedia
async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        statusMessage.textContent = 'Por favor, digite o nome de um santo.';
        return;
    }

    statusMessage.textContent = 'Buscando registros na Wikipedia...';
    saintCard.classList.add('hidden');

    // Formatação correta da URL mantendo o underline visível para a Wikipedia
    const termoTratado = termoBusca.trim().replace(/\s+/g, '_');
    const termoFinal = encodeURIComponent(termoTratado).replace(/%5FB/g, '_');

    try {
        // Usa a API da Wikipedia aceitando redirecionamentos automáticos
        const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${termoFinal}?redirect=true`;
        
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Não foi possível encontrar a página para "${termoBusca}". Tente o nome completo (ex: "Santo Agostinho" ou "São Francisco de Assis").`);
        }

        const data = await resposta.json();

        // Se a página retornada for uma página de busca/desambiguação ou não tiver resumo
        if (data.type === 'disambiguation') {
            throw new Error(`O termo "${termoBusca}" é muito genérico. Tente especificar melhor o nome do santo.`);
        }

        // Injeta os dados retornados no DOM
        saintName.textContent = data.title;
        saintBio.textContent = data.extract || 'Nenhum resumo disponível para este artigo.';
        
        // Exibe ou esconde a imagem
        if (data.thumbnail && data.thumbnail.source) {
            saintImg.src = data.thumbnail.source;
            saintImg.style.display = 'block';
        } else {
            saintImg.style.display = 'none';
        }

        // Link oficial para a página
        if (data.content_urls && data.content_urls.desktop) {
            saintLink.href = data.content_urls.desktop.page;
        }

        statusMessage.textContent = '';
        saintCard.classList.remove('hidden');

    } catch (erro) {
        statusMessage.textContent = erro.message;
    }
}

// Escuta o clique no botão de busca
searchBtn.addEventListener('click', () => {
    buscarSantoWikipedia(saintInput.value);
});

// Escuta a tecla Enter
saintInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        buscarSantoWikipedia(saintInput.value);
    }
});

// Escuta os cliques nos chips de sugestão rápida
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const nomeSanto = chip.getAttribute('data-name');
        saintInput.value = nomeSanto;
        buscarSantoWikipedia(nomeSanto);
    });
});
