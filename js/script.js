// Configurações
let paginaAtual = 1;
const filmesPorPagina = 10;
let palavrasEncontradas = 0;
const totalPalavras = 20;

// Elementos DOM
const filmesContainer = document.getElementById('filmesContainer');
const paginaAnteriorBtn = document.getElementById('paginaAnterior');
const proximaPaginaBtn = document.getElementById('proximaPagina');
const numeroPagina = document.getElementById('numeroPagina');
const filmeModal = document.getElementById('filmeModal');
const closeModalBtn = document.getElementById('closeModal');
const modalPoster = document.getElementById('modalPoster');
const modalTitulo = document.getElementById('modalTitulo');
const modalData = document.getElementById('modalData');
const modalGenero = document.getElementById('modalGenero');
const modalAvaliacao = document.getElementById('modalAvaliacao');
const modalSinopse = document.getElementById('modalSinopse');
const jogoContainer = document.getElementById('jogo-container');

// Função para buscar filmes da API
const buscarFilmes = async (pagina = 1) => {
    try {
        const respostaGeneros = await fetch(
            'https://api.themoviedb.org/3/genre/movie/list?language=pt-BR',
            {
                headers: {
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MmVkM2VkNzM3YThiODMzMTVmMTliZTgyMDAxMDkxYyIsIm5iZiI6MTc0NTg4MTYxNy44ODksInN1YiI6IjY4MTAwYTExYTkwYWNhZjZlZWVhZWVkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pb87VoUpzgIS9bGtDrIrjqHFAz-FI5DCB_ctOWgJG80`,
                    'accept': 'application/json'
                }
            }
        );
        const dadosGeneros = await respostaGeneros.json();
        const generosMap = dadosGeneros.genres.reduce((map, genero) => {
            map[genero.id] = genero.name;
            return map;
        }, {});

        const respostaFilmes = await fetch(
            `https://api.themoviedb.org/3/discover/movie?page=${pagina}&sort_by=popularity.desc&include_adult=false&language=pt-BR&include_image_language=pt,null`,
            {
                headers: {
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MmVkM2VkNzM3YThiODMzMTVmMTliZTgyMDAxMDkxYyIsIm5iZiI6MTc0NTg4MTYxNy44ODksInN1YiI6IjY4MTAwYTExYTkwYWNhZjZlZWVhZWVkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pb87VoUpzgIS9bGtDrIrjqHFAz-FI5DCB_ctOWgJG80`,
                    'accept': 'application/json'
                }
            }
        );
        const dadosFilmes = await respostaFilmes.json();
        
        const filmesLimitados = dadosFilmes.results.slice(0, filmesPorPagina);
        
        const filmesComGeneros = filmesLimitados.map(filme => ({
            ...filme,
            generosFormatados: filme.genre_ids && filme.genre_ids.length > 0 
                ? filme.genre_ids.map(id => generosMap[id]).filter(Boolean).join(', ')
                : 'Gênero não disponível'
        }));

        return filmesComGeneros || [];
    } catch (erro) {
        console.error("Erro ao buscar filmes:", erro);
        return [];
    }
};

// Função para exibir filmes na página
async function buscarEExibirFilmes(pagina) {
    filmesContainer.innerHTML = '<div class="carregando">Carregando filmes...</div>';
    
    try {
        const filmes = await buscarFilmes(pagina);
        
        if (filmes.length === 0) {
            filmesContainer.innerHTML = '<div class="carregando">Nenhum filme encontrado.</div>';
            return;
        }
        
        filmesContainer.innerHTML = '';
        
        filmes.forEach(filme => {
            const filmeCard = document.createElement('div');
            filmeCard.className = 'filme-card';
            filmeCard.innerHTML = `
                <img class="filme-poster" src="https://image.tmdb.org/t/p/w500${filme.poster_path}" alt="${filme.title}" onerror="this.src='https://via.placeholder.com/500x750?text=Poster+Não+Disponível'">
                <div class="filme-info">
                    <div class="filme-titulo" title="${filme.title}">${filme.title}</div>
                    <div class="filme-genero">${filme.generosFormatados}</div>
                    <div class="filme-data">${filme.release_date ? filme.release_date.split('-')[0] : 'Data desconhecida'}</div>
                </div>
            `;
            
            filmeCard.addEventListener('click', () => abrirModal(filme));
            filmesContainer.appendChild(filmeCard);
        });
        
        numeroPagina.textContent = `Página ${pagina}`;
        paginaAnteriorBtn.disabled = pagina === 1;
        
    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        filmesContainer.innerHTML = '<div class="carregando">Erro ao carregar filmes. Tente novamente mais tarde.</div>';
    }
}

// Função para criar o caça-palavras
function criarCacaPalavras(palavrasSelecionadas) {
    const tamanhoGrade = 30;
    let grade = Array(tamanhoGrade).fill().map(() => Array(tamanhoGrade).fill(''));
    
    // Direções possíveis (8 direções)
    const direcoes = [
        { x: 1, y: 0 },   // Direita
        { x: 0, y: 1 },   // Baixo
        { x: 1, y: 1 },   // Diagonal inferior direita
        { x: 1, y: -1 },  // Diagonal superior direita
        { x: -1, y: 0 },  // Esquerda
        { x: 0, y: -1 },  // Cima
        { x: -1, y: -1 }, // Diagonal superior esquerda
        { x: -1, y: 1 }   // Diagonal inferior esquerda
    ];
    
    // Insere as palavras na grade
    palavrasSelecionadas.forEach(palavra => {
        let inserida = false;
        let tentativas = 0;
        
        while (!inserida && tentativas < 100) {
            tentativas++;
            const direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
            const maxX = tamanhoGrade - (Math.abs(direcao.x) * palavra.length);
            const maxY = tamanhoGrade - (Math.abs(direcao.y) * palavra.length);
            
            // Verifica se a palavra cabe na grade nesta direção
            if (maxX < 0 || maxY < 0) continue;
            
            const x = Math.floor(Math.random() * maxX);
            const y = Math.floor(Math.random() * maxY);
            
            // Calcula posição inicial considerando direções negativas
            const startX = direcao.x < 0 ? x + palavra.length - 1 : x;
            const startY = direcao.y < 0 ? y + palavra.length - 1 : y;
            
            // Verifica limites
            if (startX < 0 || startX >= tamanhoGrade || startY < 0 || startY >= tamanhoGrade) {
                continue;
            }
            
            let podeInserir = true;
            
            // Verifica se pode inserir
            for (let i = 0; i < palavra.length; i++) {
                const posX = startX + (i * direcao.x);
                const posY = startY + (i * direcao.y);
                
                // Verifica se está dentro dos limites
                if (posX < 0 || posX >= tamanhoGrade || posY < 0 || posY >= tamanhoGrade) {
                    podeInserir = false;
                    break;
                }
                
                if (grade[posY][posX] !== '' && grade[posY][posX] !== palavra[i]) {
                    podeInserir = false;
                    break;
                }
            }
            
            // Insere a palavra
            if (podeInserir) {
                for (let i = 0; i < palavra.length; i++) {
                    const posX = startX + (i * direcao.x);
                    const posY = startY + (i * direcao.y);
                    grade[posY][posX] = palavra[i];
                }
                inserida = true;
            }
        }
        
        if (!inserida) {
            console.warn(`Não foi possível inserir a palavra: ${palavra}`);
        }
    });
    
    // Preenche os espaços vazios com letras aleatórias
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < tamanhoGrade; y++) {
        for (let x = 0; x < tamanhoGrade; x++) {
            if (grade[y][x] === '') {
                grade[y][x] = letras.charAt(Math.floor(Math.random() * letras.length));
            }
        }
    }
    
    return grade;
}

// Função para abrir o modal com detalhes do filme e o jogo
function abrirModal(filme) {
    palavrasEncontradas = 0;
    modalPoster.src = filme.poster_path 
        ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` 
        : 'https://via.placeholder.com/500x750?text=Poster+Não+Disponível';
    modalTitulo.textContent = filme.title;
    modalData.textContent = filme.release_date || 'Data desconhecida';
    modalGenero.textContent = filme.generosFormatados;
    modalAvaliacao.textContent = `⭐ ${filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A'}/10`;
    
    // Processa a sinopse
    const sinopse = filme.overview || 'Sinopse não disponível.';
    
    // Seleciona 20 palavras da sinopse com mais de 5 letras
    const palavras = sinopse.split(/\s+/)
        .filter(palavra => palavra.length > 5)
        .map(palavra => palavra.replace(/[.,!?;:]/g, '').toUpperCase());
    
    const palavrasSelecionadas = [];
    const palavrasUnicas = [...new Set(palavras)]; // Remove duplicadas
    
    // Seleciona até 20 palavras únicas aleatórias
    while (palavrasSelecionadas.length < totalPalavras && palavrasUnicas.length > 0) {
        const randomIndex = Math.floor(Math.random() * palavrasUnicas.length);
        palavrasSelecionadas.push(palavrasUnicas[randomIndex]);
        palavrasUnicas.splice(randomIndex, 1);
    }
    
    // Se não tiver 20 palavras com mais de 5 letras, completa com palavras menores
    if (palavrasSelecionadas.length < totalPalavras) {
        const palavrasAdicionais = sinopse.split(/\s+/)
            .filter(palavra => palavra.length <= 5 && palavra.length > 2)
            .map(palavra => palavra.replace(/[.,!?;:]/g, '').toUpperCase())
            .filter(palavra => !palavrasSelecionadas.includes(palavra));
        
        while (palavrasSelecionadas.length < totalPalavras && palavrasAdicionais.length > 0) {
            const randomIndex = Math.floor(Math.random() * palavrasAdicionais.length);
            palavrasSelecionadas.push(palavrasAdicionais[randomIndex]);
            palavrasAdicionais.splice(randomIndex, 1);
        }
    }
    
    // Destaca as palavras selecionadas na sinopse (nova parte adicionada)
    let sinopseFormatada = sinopse;
    palavrasSelecionadas.forEach(palavra => {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        sinopseFormatada = sinopseFormatada.replace(regex, match => `<strong>${match}</strong>`);
    });
    
    modalSinopse.innerHTML = `<p>${sinopseFormatada}</p>`;
    
    // Restante do código permanece EXATAMENTE igual
    const listaPalavrasHTML = palavrasSelecionadas.map((palavra, index) => 
        `<li id="palavra-${index}" data-palavra="${palavra}" style="text-decoration: none;">${index + 1}. ${palavra}</li>`
    ).join('');
    
    const grade = criarCacaPalavras(palavrasSelecionadas);
    
    let tabelaHTML = '<table id="caca-palavras">';
    for (let y = 0; y < 30; y++) {
        tabelaHTML += '<tr>';
        for (let x = 0; x < 30; x++) {
            tabelaHTML += `<td data-x="${x}" data-y="${y}" data-letra="${grade[y][x]}">${grade[y][x]}</td>`;
        }
        tabelaHTML += '</tr>';
    }
    tabelaHTML += '</table>';
    
    jogoContainer.innerHTML = `
        <h3>Palavras para encontrar (${palavrasSelecionadas.length}):</h3>
        <ol id="lista-palavras">${listaPalavrasHTML}</ol>
        <h3>Caça-Palavras:</h3>
        ${tabelaHTML}
    `;
    
    configurarSelecao(palavrasSelecionadas);
    
    filmeModal.style.display = 'flex';
}

// Função para configurar a seleção de palavras no caça-palavras
function configurarSelecao(palavrasSelecionadas) {
    const tabela = document.querySelector('#caca-palavras');
    let selecionando = false;
    let inicioSelecao = null;
    let celulasSelecionadas = [];
    
    const verificarPalavra = (palavra) => {
        const itemLista = document.querySelector(`li[data-palavra="${palavra}"]`);
        if (itemLista && !itemLista.classList.contains('palavra-encontrada')) {
            itemLista.classList.add('palavra-encontrada');
            palavrasEncontradas++;
            
            // Marca todas as células da palavra como encontradas
            celulasSelecionadas.forEach(celula => {
                celula.classList.add('celula-encontrada');
            });
            
            // Verifica se todas as palavras foram encontradas
            if (palavrasEncontradas === totalPalavras) {
                setTimeout(() => {
                    alert('Parabéns! Você encontrou todas as palavras!');
                    filmeModal.style.display = 'none';
                }, 500);
            }
            
            return true;
        }
        return false;
    };
    
    const limparSelecao = () => {
        celulasSelecionadas.forEach(celula => {
            if (!celula.classList.contains('celula-encontrada')) {
                celula.classList.remove('celula-selecionada');
            }
        });
        celulasSelecionadas = [];
    };
    
    const verificarSelecao = () => {
        if (celulasSelecionadas.length < 2) return;
        
        // Ordena as células selecionadas
        celulasSelecionadas.sort((a, b) => {
            const yA = parseInt(a.getAttribute('data-y'));
            const xA = parseInt(a.getAttribute('data-x'));
            const yB = parseInt(b.getAttribute('data-y'));
            const xB = parseInt(b.getAttribute('data-x'));
            return yA - yB || xA - xB;
        });
        
        // Obtém a palavra formada pela seleção
        const palavraSelecionada = celulasSelecionadas.map(c => c.getAttribute('data-letra')).join('');
        
        // Verifica se a palavra está na lista
        if (palavrasSelecionadas.includes(palavraSelecionada)) {
            verificarPalavra(palavraSelecionada);
        } else {
            limparSelecao();
        }
    };
    
    tabela.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TD') {
            selecionando = true;
            inicioSelecao = e.target;
            limparSelecao();
            celulasSelecionadas = [e.target];
            e.target.classList.add('celula-selecionada');
        }
    });
    
    tabela.addEventListener('mouseover', (e) => {
        if (selecionando && e.target.tagName === 'TD') {
            const celulaAtual = e.target;
            
            // Verifica se a célula atual já está selecionada
            if (celulasSelecionadas.includes(celulaAtual)) return;
            
            // Verifica se a célula atual está na mesma linha/coluna/diagonal que a primeira célula selecionada
            const xInicio = parseInt(inicioSelecao.getAttribute('data-x'));
            const yInicio = parseInt(inicioSelecao.getAttribute('data-y'));
            const xAtual = parseInt(celulaAtual.getAttribute('data-x'));
            const yAtual = parseInt(celulaAtual.getAttribute('data-y'));
            
            const diffX = xAtual - xInicio;
            const diffY = yAtual - yInicio;
            
            // Verifica se está na mesma linha, coluna ou diagonal
            if (diffX === 0 || diffY === 0 || Math.abs(diffX) === Math.abs(diffY)) {
                // Calcula a direção
                const dirX = diffX === 0 ? 0 : diffX > 0 ? 1 : -1;
                const dirY = diffY === 0 ? 0 : diffY > 0 ? 1 : -1;
                
                // Limpa seleção anterior
                limparSelecao();
                
                // Adiciona todas as células na linha entre o início e a célula atual
                celulasSelecionadas = [];
                let x = xInicio;
                let y = yInicio;
                
                while (true) {
                    const celula = document.querySelector(`td[data-x="${x}"][data-y="${y}"]`);
                    celulasSelecionadas.push(celula);
                    celula.classList.add('celula-selecionada');
                    
                    if (x === xAtual && y === yAtual) break;
                    
                    x += dirX;
                    y += dirY;
                }
            }
        }
    });
    
    tabela.addEventListener('mouseup', () => {
        selecionando = false;
        verificarSelecao();
    });
    
    // Impede a seleção de texto durante o arrasto
    tabela.addEventListener('selectstart', (e) => {
        if (selecionando) {
            e.preventDefault();
        }
    });
}

// Event Listeners
paginaAnteriorBtn.addEventListener('click', () => {
    if (paginaAtual > 1) {
        paginaAtual--;
        buscarEExibirFilmes(paginaAtual);
    }
});

proximaPaginaBtn.addEventListener('click', () => {
    paginaAtual++;
    buscarEExibirFilmes(paginaAtual);
});

closeModalBtn.addEventListener('click', () => {
    filmeModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === filmeModal) {
        filmeModal.style.display = 'none';
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    buscarEExibirFilmes(paginaAtual);
});