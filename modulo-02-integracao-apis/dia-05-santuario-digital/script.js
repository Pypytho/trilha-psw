console.log("=== SCRIPT CARREGADO COM AXIOS ===");

document.addEventListener('DOMContentLoaded', function () {
    var saintInput = document.getElementById('saint-input');
    var searchBtn = document.getElementById('search-btn');
    var statusMessage = document.getElementById('status-message');
    var chips = document.querySelectorAll('.chip');

    var saintCard = document.getElementById('saint-card');
    var saintImg = document.getElementById('saint-img');
    var saintName = document.getElementById('saint-name');
    var saintBio = document.getElementById('saint-bio');
    var saintLink = document.getElementById('saint-link');

    function buscarWikipedia(termoBusca) {
        console.log("-> Função buscarWikipedia acionada com o termo:", termoBusca);

        if (!termoBusca || !termoBusca.trim()) {
            if (statusMessage) statusMessage.textContent = 'Por favor, digite um termo para buscar.';
            return;
        }

        var termo = termoBusca.trim();
        if (statusMessage) statusMessage.textContent = 'Buscando na Wikipédia...';
        if (saintCard) saintCard.classList.add('hidden');

        var searchUrl = 'https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(termo) + '&format=json&origin=*';

        axios.get(searchUrl)
            .then(function (response) {
                console.log("1. Resposta da busca recebida:", response.data);
                var searchResults = response.data.query.search;

                if (!searchResults || searchResults.length === 0) {
                    throw new Error('Nenhum resultado encontrado para "' + termo + '".');
                }

                var primeiroTitulo = searchResults[0].title;
                var detailsUrl = 'https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&titles=' + encodeURIComponent(primeiroTitulo) + '&format=json&origin=*';

                return axios.get(detailsUrl);
            })
            .then(function (responseDetails) {
                console.log("2. Detalhes da página recebidos:", responseDetails.data);
                var pages = responseDetails.data.query.pages;
                var pageId = Object.keys(pages)[0];

                if (pageId === "-1") {
                    throw new Error('Artigo não encontrado.');
                }

                var artigo = pages[pageId];

                if (saintName) saintName.textContent = artigo.title;
                if (saintBio) saintBio.textContent = artigo.extract || 'Resumo indisponível.';

                if (saintImg) {
                    if (artigo.original && artigo.original.source) {
                        saintImg.src = artigo.original.source;
                        saintImg.style.display = 'block';
                    } else {
                        saintImg.style.display = 'none';
                    }
                }

                if (saintLink && artigo.fullurl) {
                    saintLink.href = artigo.fullurl;
                }

                if (statusMessage) statusMessage.textContent = '';
                if (saintCard) saintCard.classList.remove('hidden');
            })
            .catch(function (error) {
                console.error("Erro na busca:", error);
                var mensagemErro = error.message || 'Erro ao conectar com a Wikipédia.';
                if (statusMessage) statusMessage.textContent = '[Erro]: ' + mensagemErro;
            });
    }

    if (searchBtn) {
        searchBtn.onclick = function (e) {
            e.preventDefault();
            console.log("Botão Pesquisar clicado");
            if (saintInput) buscarWikipedia(saintInput.value);
        };
    } else {
        console.error("ERRO: Elemento #search-btn não foi encontrado no DOM!");
    }

    if (saintInput) {
        saintInput.onkeypress = function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                console.log("Enter pressionado no input");
                buscarWikipedia(saintInput.value);
            }
        };
    }

    chips.forEach(function (chip) {
        chip.onclick = function () {
            var nome = chip.getAttribute('data-name') || chip.textContent;
            console.log("Chip clicado:", nome);
            if (saintInput) saintInput.value = nome;
            buscarWikipedia(nome);
        };
    });
});
