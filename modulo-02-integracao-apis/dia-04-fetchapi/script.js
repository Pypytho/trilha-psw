// Referências aos elementos do DOM
const usernameInput = document.querySelector('#username-input');
const searchBtn = document.querySelector('#search-btn');
const statusMessage = document.querySelector('#status-message');

const profileCard = document.querySelector('#profile-card');
const avatar = document.querySelector('#avatar');
const nameElem = document.querySelector('#name');
const bioElem = document.querySelector('#bio');
const reposElem = document.querySelector('#repos');
const followersElem = document.querySelector('#followers');
const profileLink = document.querySelector('#profile-link');

// Função assíncrona que consome a API do GitHub
async function fetchGitHubUser(username) {
    if (!username) {
        statusMessage.textContent = 'Por favor, digite um nome de usuário.';
        return;
    }

    statusMessage.textContent = 'Buscando dados no GitHub...';
    profileCard.classList.add('hidden');

    try {
        // Faz a requisição HTTP GET para a API pública do GitHub
        const response = await fetch(`https://api.github.com/users/${username}`);

        // Trata erro 404 (Usuário não encontrado)
        if (!response.ok) {
            throw new Error('Usuário não encontrado!');
        }

        // Converte a resposta em JSON
        const data = await response.json();

        // Atualiza os elementos do DOM com os dados retornados
        avatar.src = data.avatar_url;
        nameElem.textContent = data.name || data.login;
        bioElem.textContent = data.bio || 'Este perfil não possui bio.';
        reposElem.textContent = data.public_repos;
        followersElem.textContent = data.followers;
        profileLink.href = data.html_url;

        // Exibe o card e limpa a mensagem de status
        statusMessage.textContent = '';
        profileCard.classList.remove('hidden');

    } catch (error) {
        statusMessage.textContent = error.message;
    }
}

// Escuta o clique no botão de busca
searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    fetchGitHubUser(username);
});
