// Referências aos elementos do DOM
const saintInput = document.querySelector('#saint-input');
const searchBtn = document.querySelector('#search-btn');
const statusMessage = document.querySelector('#status-message');
const chips = document.querySelectorAll('.chip');

const saintCard = document.querySelector('#saint-card');
const saintImg = document.querySelector('#saint-img');
const saintName = document.querySelector('#saint-name');
const saintTitle = document.querySelector('#saint-title');
const saintDate = document.querySelector('#saint-date');
const saintPeriod = document.querySelector('#saint-period');
const saintPatron = document.querySelector('#saint-patron');
const saintBio = document.querySelector('#saint-bio');
const saintQuote = document.querySelector('#saint-quote');

// Função que faz o fetch do arquivo JSON e busca o santo
async function buscarSanto(termoBusca) {
    if (!termoBusca) {
        statusMessage.textContent = 'Por favor, digite o nome de um santo.';
        return;
    }

    statusMessage.textContent = 'Buscando registros na biblioteca...';
    saintCard.classList.add('hidden');

    try {
        // Garantimos o caminho relativo correto do arquivo santos.json
        const resposta = await fetch('./santos.json');
        
        // Se o arquivo não for encontrado no servidor (Erro 404)
        if (!resposta.ok) {
            throw new Error(`Erro ao carregar o arquivo santos.json (Status: ${resposta.status})`);
        }

        const listaDeSantos = await resposta.json();

        // Limpa o termo de busca (remove espaços extras)
        const termoLimpo = termoBusca.trim().toLowerCase();

        // Busca aproximada no nome ou id do santo
        const santoEncontrado = listaDeSantos.find(santo => {
            const nomeSanto = santo.nome.toLowerCase();
            const idSanto = santo.id.toLowerCase();
            return nomeSanto.includes(termoLimpo) || idSanto.includes(termoLimpo);
        });

        if (!santoEncontrado) {
            throw new Error(`Nenhum santo encontrado para "${termoBusca}". Tente digitar: Agostinho, Francisco, Teresa ou Tomás.`);
        }

        // Preenche os dados no HTML
        saintImg.src = santoEncontrado.imagem;
        saintName.textContent = santoEncontrado.nome;
        saintTitle.textContent = santoEncontrado.titulo;
        saintDate.textContent = santoEncontrado.dataFestiva;
        saintPeriod.textContent = santoEncontrado.periodo;
        saintPatron.textContent = santoEncontrado.padroeiro;
        saintBio.textContent = santoEncontrado.biografia;
        saintQuote.textContent = `"${santoEncontrado.frase}"`;

        // Exibe o card
        statusMessage.textContent = '';
        saintCard.classList.remove('hidden');

    } catch (erro) {
        // Exibe a mensagem exata do erro na tela do usuário
        statusMessage.textContent = erro.message;
        console.error('Detalhe do Erro:', erro);
    }
}


    statusMessage.textContent = 'Buscando registros na biblioteca...';
    saintCard.classList.add('hidden');

    try {
        // Faz a requisição assíncrona ao arquivo santos.json
        const resposta = await fetch('santos.json');
        
        if (!resposta.ok) {
            throw new Error('Não foi possível carregar a base de dados de santos.');
        }

        const listaDeSantos = await resposta.json();

        // Procura no array um santo cujo nome contenha o termo digitado (ignorando maiúsculas/minúsculas)
        const santoEncontrado = listaDeSantos.find(santo => 
            santo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            santo.id.toLowerCase().includes(termoBusca.toLowerCase())
        );

        if (!santoEncontrado) {
            throw new Error(`Nenhum santo encontrado com o nome "${termoBusca}".`);
        }

        // Renderiza as informações no DOM
        saintImg.src = santoEncontrado.imagem;
        saintName.textContent = santoEncontrado.nome;
        saintTitle.textContent = santoEncontrado.titulo;
        saintDate.textContent = santoEncontrado.dataFestiva;
        saintPeriod.textContent = santoEncontrado.periodo;
        saintPatron.textContent = santoEncontrado.padroeiro;
        saintBio.textContent = santoEncontrado.biografia;
        saintQuote.textContent = `"${santoEncontrado.frase}"`;

        statusMessage.textContent = '';
        saintCard.classList.remove('hidden');

    } catch (erro) {
        statusMessage.textContent = erro.message;
    }
}

// Escuta o clique no botão de busca
searchBtn.addEventListener('click', () => {
    const termo = saintInput.value.trim();
    buscarSanto(termo);
});

// Escuta o evento "Enter" ao digitar na caixa de texto
saintInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const termo = saintInput.value.trim();
        buscarSanto(termo);
    }
});

// Escuta o clique nos botões de sugestão rápida
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const nomeSanto = chip.getAttribute('data-name');
        saintInput.value = nomeSanto;
        buscarSanto(nomeSanto);
    });
});
