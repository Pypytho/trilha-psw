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

// Termos que PROÍBEM a exibição do artigo
const TERMOS_PROIBIDOS = [
    'futebol', 'clube', 'esporte', 'estádio', 'município', 
    'televisão', 'empresa', 'associação', 'série de televisão', 'campeonato'
];

// Termos que CONFIRMAM que se trata de uma figura sagrada/religiosa
const TERMOS_SACROS = [
    'santo', 'santa', 'são', 'canonizad', 'beatificad', 'mártir', 
    'papa', 'bispo', 'virgem', 'doutor da igreja', 'igreja católica', 
    'festa litúrgica', 'beato', 'beata', 'frade', 'monge', 'freira'
];

async function buscarSantoWikipedia(termoBusca) {
    if (!termoBusca || !termoBusca.trim()) {
        setTexto(statusMessage, 'Por favor, digite o nome de um santo.');
        return;
    }

    const termo = termoBusca.trim();
    setTexto(statusMessage, 'Pesquisando na biblioteca de santos...');
    if (saintCard) saintCard.classList.add('hidden');

    try {
        // 1. Gera lista de tentativas de títulos
        const termoLower = termo.toLowerCase();
        let tentativas = [];

        if (termoLower.startsWith('são ') || termoLower.startsWith('santo ') || termoLower.startsWith('santa ') || termoLower.startsWith('beato ') || termoLower.startsWith('beata ')) {
            tentativas = [termo];
        } else {
            tentativas = [
                `Santo ${termo}`,
                `Santa ${termo}`,
                `São ${termo}`,
                `Beato ${termo}`,
                `Beata ${termo}`,
                termo
            ];
        }

        let artigoValido = null;

        // 2. Testa cada variação usando a REST API v1 da Wikipédia (muito mais precisa)
        for (const tituloTentativa of tentativas) {
            const urlRest = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tituloTentativa)}`;
            
            const response = await fetch(urlRest);
            if (!response.ok) continue;

            const data = await response.json();

            // Ignora desambiguações ou páginas sem extrato
            if (data.type === 'disambiguation' || !data.extract) continue;

            const titulo = (data.title || '').toLowerCase();
            const extract = (data.extract || '').toLowerCase();
            const description = (data.description || '').toLowerCase();

            // REGRA 1: Se contiver termos proibidos (futebol, clube, etc.) no título, resumo ou descrição -> BLOQUEIA
            const ehProibido = TERMOS_PROIBIDOS.some(t => 
                titulo.includes(t) || extract.includes(t) || description.includes(t)
            );

            if (ehProibido) continue;

            // REGRA 2: Deve conter pelo menos uma evidência sacra no texto ou descrição
            const ehSacro = TERMOS_SACROS.some(t => 
                titulo.includes(t) || extract.includes(t) || description.includes(t)
            );

            if (ehSacro) {
                artigoValido = data;
                break;
            }
        }

        // 3. Se não achou via REST API, faz uma busca de socorro pelo opensearch
        if (!artigoValido) {
            const openSearchUrl = `https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent('Santo ' + termo)}&limit=1&format=json&origin=*`;
            const osResponse = await fetch(openSearchUrl);
            const osData = await osResponse.json();

            if (osData && osData[1] && osData[1].length > 0) {
                const tituloEncontrado = osData[1][0];
                const urlRest = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tituloEncontrado)}`;
                const res = await fetch(urlRest);
                if (res.ok) {
                    const data = await res.json();
                    const extract = (data.extract || '').toLowerCase();
                    const description = (data.description || '').toLowerCase();
                    
                    const ehProibido = TERMOS_PROIBIDOS.some(t => extract.includes(t) || description.includes(t));
                    const ehSacro = TERMOS_SACROS.some(t => extract.includes(t) || description.includes(t));

                    if (!ehProibido && ehSacro) {
                        artigoValido = data;
                    }
                }
            }
        }

        if (!artigoValido) {
            throw new Error(`"${termo}" não foi encontrado como Santo ou Santa. Digite um nome válido (ex: Agostinho, Rita, Bento, Expedito).`);
        }

        // 4. Exibe o resultado na tela
        setTexto(saintName, artigoValido.title);
        setTexto(saintBio, artigoValido.extract);

        if (saintImg) {
            if (artigoValido.thumbnail && artigoValido.thumbnail.source) {
                saintImg.src = artigoValido.thumbnail.source;
                saintImg.style.display = 'block';
            } else {
                saintImg.style.display = 'none';
            }
        }

        if (saintLink && artigoValido.content_urls && artigoValido.content_urls.desktop) {
            saintLink.href = artigoValido.content_urls.desktop.page;
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
