let palavrasAtivas = []; // Variável global para as palavras ativas
let palavrasEncontradas = 0;
const totalPalavras = 20;
let corAtual = 0;
let palavrasComCores = new Map();
let gradeAtual = null;
let palavrasNaGrade = new Map(); // Armazena posições das palavras na grade
let nivelDificuldade = null; // Nível de dificuldade selecionado
let jogoIniciado = false; // Flag para controlar se o jogo foi iniciado

// Cores para as palavras encontradas
const cores = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#A3E4D7', '#FAD7A0', '#D5A6BD', '#AED6F1', '#A9DFBF'
];

// Função para randomizar as imagens
function randomizarImagens() {
    // Lista das imagens que realmente existem (atualize conforme suas imagens)
    const imagensExistentes = [
        '01', '02', '03', '04' // Adicione os números das imagens que você tem
    ];
    
    const imagensDisponiveis = imagensExistentes.map(numero => ({
        src: `images/image${numero}1200x628.png`,
        alt: `Imagem ${numero}`
    }));
    
    // Embaralha o array de imagens disponíveis
    for (let i = imagensDisponiveis.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [imagensDisponiveis[i], imagensDisponiveis[j]] = [imagensDisponiveis[j], imagensDisponiveis[i]];
    }
    
    return imagensDisponiveis;
}

// Função para inserir imagens randomizadas no jogo
function inserirImagensJogo() {
    const jogoImageGallery = document.getElementById('jogoImageGallery');
    if (jogoImageGallery) {
        const imagensRandomizadas = randomizarImagens();
        jogoImageGallery.innerHTML = '';
        
        // Adiciona até 4 imagens aleatórias disponíveis
        const quantidadeMaxima = Math.min(4, imagensRandomizadas.length);
        for (let i = 0; i < quantidadeMaxima; i++) {
            const galleryImage = document.createElement('div');
            galleryImage.className = 'jogo-gallery-image';
            // Adiciona link clicável para todas as imagens
            galleryImage.innerHTML = `
                <a href="https://kaleidoscopic-seahorse-278409.netlify.app/" target="_blank" style="display: block; text-decoration: none;">
                    <img src="${imagensRandomizadas[i].src}" alt="${imagensRandomizadas[i].alt}" />
                </a>
            `;
            jogoImageGallery.appendChild(galleryImage);
        }
    }
}

// Função global para definir dificuldade
function definirDificuldade(nivel) {
    // Se o jogo já foi iniciado, pergunta se o usuário tem certeza
    if (jogoIniciado) {
        const confirmacao = confirm(
            "⚠️ ATENÇÃO!\n\n" +
            "Você tem certeza que deseja alterar o nível de dificuldade?\n\n" +
            "Esta ação irá reiniciar completamente seu progresso atual.\n" +
            "Todas as palavras encontradas serão perdidas.\n\n" +
            "Deseja continuar?"
        );
        
        if (!confirmacao) {
            return; // Cancela a alteração se o usuário não confirmar
        }
        
        // Reset das variáveis do jogo
        palavrasEncontradas = 0;
        corAtual = 0;
        palavrasComCores.clear();
        palavrasNaGrade.clear();
        palavrasAtivas = [];
    }
    
    nivelDificuldade = nivel;
    jogoIniciado = true;
    
    // Remove o texto piscando
    document.getElementById('gradeContainer').classList.remove('mostrar-instrucao');
    
    // Inicia o jogo com o nível selecionado
    criarJogoComDificuldade();
}

// Função global para ajuda (chamada pelo onclick)
function ajudarComPalavra() {
    console.log('Função ajudarComPalavra chamada!'); // Debug
    
    // Encontra a primeira palavra que ainda não foi encontrada
    let palavraProcurada = null;
    
    for (const palavra of palavrasAtivas) {
        const itemLista = document.querySelector(`li[data-palavra="${palavra}"]`);
        if (itemLista && !itemLista.classList.contains('palavra-encontrada')) {
            palavraProcurada = palavra;
            break;
        }
    }
    
    if (!palavraProcurada) {
        alert('Todas as palavras já foram encontradas!');
        return;
    }
    
    console.log('Próxima palavra a encontrar:', palavraProcurada); // Debug
    
    // Remove pulsação anterior
    document.querySelectorAll('.pulsar').forEach(el => {
        el.classList.remove('pulsar');
    });
    
    // Encontra as posições da palavra na grade
    const posicoes = palavrasNaGrade.get(palavraProcurada);
    console.log('Posições da palavra:', posicoes); // Debug
    
    if (posicoes && posicoes.length > 0) {
        console.log('Adicionando pulsação...'); // Debug
        // Adiciona efeito de pulsação nas células da palavra
        posicoes.forEach(pos => {
            const celula = document.querySelector(`td[data-x="${pos.x}"][data-y="${pos.y}"]`);
            if (celula) {
                celula.classList.add('pulsar');
                console.log('Pulsação adicionada na célula:', pos.x, pos.y); // Debug
            }
        });
        
        // Remove a pulsação após 3 segundos
        setTimeout(() => {
            document.querySelectorAll('.pulsar').forEach(el => {
                el.classList.remove('pulsar');
            });
            console.log('Pulsação removida'); // Debug
        }, 3000);
    } else {
        console.error('Posições da palavra não encontradas!');
        alert('Erro: palavra não encontrada na grade!');
    }
}

// Função para obter parâmetros da URL
function obterParametroURL(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}

// Função para criar o caça-palavras
function criarCacaPalavras(palavrasSelecionadas) {
    const tamanhoGradeX = 30; // Colunas
    const tamanhoGradeY = 20; // Linhas
    let grade = Array(tamanhoGradeY).fill().map(() => Array(tamanhoGradeX).fill(''));
    palavrasNaGrade.clear(); // Limpa as posições das palavras anteriores
    
    // Define direções baseadas no nível de dificuldade
    let direcoes;
    if (nivelDificuldade === 'facil') {
        // Fácil: apenas horizontal (esquerda para direita) e vertical (cima para baixo)
        direcoes = [
            { x: 1, y: 0 },   // Direita
            { x: 0, y: 1 }    // Baixo
        ];
    } else if (nivelDificuldade === 'medio') {
        // Médio: horizontal, vertical e diagonais (apenas da esquerda para direita)
        direcoes = [
            { x: 1, y: 0 },   // Direita
            { x: 0, y: 1 },   // Baixo
            { x: 1, y: 1 },   // Diagonal inferior direita
            { x: 1, y: -1 }   // Diagonal superior direita
        ];
    } else {
        // Difícil: todas as direções
        direcoes = [
            { x: 1, y: 0 },   // Direita
            { x: 0, y: 1 },   // Baixo
            { x: 1, y: 1 },   // Diagonal inferior direita
            { x: 1, y: -1 },  // Diagonal superior direita
            { x: -1, y: 0 },  // Esquerda
            { x: 0, y: -1 },  // Cima
            { x: -1, y: -1 }, // Diagonal superior esquerda
            { x: -1, y: 1 }   // Diagonal inferior esquerda
        ];
    }
    
    // Insere as palavras na grade
    palavrasSelecionadas.forEach(palavra => {
        let inserida = false;
        let tentativas = 0;
        
        while (!inserida && tentativas < 100) {
            tentativas++;
            const direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
            const maxX = tamanhoGradeX - (Math.abs(direcao.x) * palavra.length);
            const maxY = tamanhoGradeY - (Math.abs(direcao.y) * palavra.length);
            
            // Verifica se a palavra cabe na grade nesta direção
            if (maxX < 0 || maxY < 0) continue;
            
            const x = Math.floor(Math.random() * maxX);
            const y = Math.floor(Math.random() * maxY);
            
            // Calcula posição inicial considerando direções negativas
            const startX = direcao.x < 0 ? x + palavra.length - 1 : x;
            const startY = direcao.y < 0 ? y + palavra.length - 1 : y;
            
            // Verifica limites
            if (startX < 0 || startX >= tamanhoGradeX || startY < 0 || startY >= tamanhoGradeY) {
                continue;
            }
            
            let podeInserir = true;
            
            // Verifica se pode inserir
            for (let i = 0; i < palavra.length; i++) {
                const posX = startX + (i * direcao.x);
                const posY = startY + (i * direcao.y);
                
                // Verifica se está dentro dos limites
                if (posX < 0 || posX >= tamanhoGradeX || posY < 0 || posY >= tamanhoGradeY) {
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
                const posicoes = [];
                for (let i = 0; i < palavra.length; i++) {
                    const posX = startX + (i * direcao.x);
                    const posY = startY + (i * direcao.y);
                    grade[posY][posX] = palavra[i];
                    posicoes.push({ x: posX, y: posY });
                }
                palavrasNaGrade.set(palavra, posicoes); // Armazena as posições da palavra
                inserida = true;
            }
        }
        
        if (!inserida) {
            console.warn(`Não foi possível inserir a palavra: ${palavra}`);
        }
    });
    
    // Preenche os espaços vazios com letras aleatórias
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < tamanhoGradeY; y++) {
        for (let x = 0; x < tamanhoGradeX; x++) {
            if (grade[y][x] === '') {
                grade[y][x] = letras.charAt(Math.floor(Math.random() * letras.length));
            }
        }
    }
    
    gradeAtual = grade; // Armazena a grade atual
    return grade;
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
            // Atribui uma cor única para esta palavra
            const cor = cores[corAtual % cores.length];
            palavrasComCores.set(palavra, cor);
            corAtual++;
            
            itemLista.classList.add('palavra-encontrada');
            itemLista.style.backgroundColor = cor;
            itemLista.style.color = '#fff';
            itemLista.style.fontWeight = 'bold';
            palavrasEncontradas++;
            
            // Marca todas as células da palavra como encontradas com a mesma cor
            celulasSelecionadas.forEach(celula => {
                celula.classList.add('celula-encontrada');
                celula.style.backgroundColor = cor;
                celula.style.color = '#fff';
                celula.style.fontWeight = 'bold';
            });
            
            // Marca a palavra na sinopse com a mesma cor
            const palavraSinopse = document.getElementById(`sinopse-${palavra}`);
            if (palavraSinopse) {
                palavraSinopse.style.backgroundColor = cor;
                palavraSinopse.style.color = '#fff';
                palavraSinopse.style.fontWeight = 'bold';
                palavraSinopse.style.padding = '2px 4px';
                palavraSinopse.style.borderRadius = '3px';
            }
            
            // Verifica se todas as palavras foram encontradas
            if (palavrasEncontradas === totalPalavras) {
                setTimeout(() => {
                    alert('Parabéns! Você encontrou todas as palavras!');
                }, 500);
            }
            
            return true;
        }
        return false;
    };
    
    const limparSelecao = () => {
        celulasSelecionadas.forEach(celula => {
            // Só remove a classe de seleção se a célula não foi encontrada
            if (!celula.classList.contains('celula-encontrada')) {
                celula.classList.remove('celula-selecionada');
            }
        });
        celulasSelecionadas = [];
    };
    
    const verificarSelecao = () => {
        if (celulasSelecionadas.length < 1) return;
        
        // Ordena as células selecionadas para formar a palavra corretamente
        celulasSelecionadas.sort((a, b) => {
            const yA = parseInt(a.getAttribute('data-y'));
            const xA = parseInt(a.getAttribute('data-x'));
            const yB = parseInt(b.getAttribute('data-y'));
            const xB = parseInt(b.getAttribute('data-x'));
            
            // Se estão na mesma linha, ordena por coluna
            if (yA === yB) return xA - xB;
            // Se estão na mesma coluna, ordena por linha
            if (xA === xB) return yA - yB;
            // Para diagonais, ordena primeiro por linha, depois por coluna
            return yA - yB || xA - xB;
        });
        
        // Obtém a palavra formada pela seleção
        const palavraSelecionada = celulasSelecionadas.map(c => c.getAttribute('data-letra')).join('');
        
        // Verifica se a palavra está na lista (tanto na ordem normal quanto reversa)
        const palavraReversa = palavraSelecionada.split('').reverse().join('');
        
        if (palavrasSelecionadas.includes(palavraSelecionada)) {
            verificarPalavra(palavraSelecionada);
        } else if (palavrasSelecionadas.includes(palavraReversa)) {
            verificarPalavra(palavraReversa);
        } else {
            // Apenas limpa a seleção atual, mas mantém as células já encontradas
            celulasSelecionadas.forEach(celula => {
                if (!celula.classList.contains('celula-encontrada')) {
                    celula.classList.remove('celula-selecionada');
                }
            });
            celulasSelecionadas = [];
        }
    };
    
    tabela.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TD') {
            selecionando = true;
            inicioSelecao = e.target;
            limparSelecao();
            celulasSelecionadas = [e.target];
            // Só adiciona a classe se não for uma célula já encontrada
            if (!e.target.classList.contains('celula-encontrada')) {
                e.target.classList.add('celula-selecionada');
            }
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
                
                // Limpa seleção anterior (mas preserva células encontradas)
                celulasSelecionadas.forEach(celula => {
                    if (!celula.classList.contains('celula-encontrada')) {
                        celula.classList.remove('celula-selecionada');
                    }
                });
                
                // Adiciona todas as células na linha entre o início e a célula atual
                celulasSelecionadas = [];
                let x = xInicio;
                let y = yInicio;
                
                while (true) {
                    const celula = document.querySelector(`td[data-x="${x}"][data-y="${y}"]`);
                    if (celula) {
                        celulasSelecionadas.push(celula);
                        // Só adiciona a classe se não for uma célula já encontrada
                        if (!celula.classList.contains('celula-encontrada')) {
                            celula.classList.add('celula-selecionada');
                        }
                    }
                    
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

// Função para criar o jogo com a dificuldade selecionada
function criarJogoComDificuldade() {
    // Obtém os dados do filme da URL
    const dadosFilmeCodificados = obterParametroURL('filme');
    
    if (!dadosFilmeCodificados) {
        alert('Erro: dados do filme não encontrados!');
        window.close();
        return;
    }
    
    let filme;
    try {
        filme = JSON.parse(decodeURIComponent(dadosFilmeCodificados));
    } catch (error) {
        alert('Erro ao decodificar dados do filme!');
        window.close();
        return;
    }
    
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
    
    // Define as palavras ativas globalmente
    palavrasAtivas = [...palavrasSelecionadas];
    console.log('Palavras ativas definidas:', palavrasAtivas); // Debug
    
    // Destaca as palavras selecionadas na sinopse
    let sinopseFormatada = sinopse;
    palavrasSelecionadas.forEach(palavra => {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        sinopseFormatada = sinopseFormatada.replace(regex, match => `<span id="sinopse-${palavra}" class="palavra-sinopse">${match}</span>`);
    });
    
    document.getElementById('filmeSinopse').innerHTML = sinopseFormatada;
    
    // Lista de palavras na coluna central
    const listaPalavrasHTML = palavrasSelecionadas.map((palavra, index) => 
        `<li id="palavra-${index}" data-palavra="${palavra}" style="text-decoration: none;">${palavra}</li>`
    ).join('');
    
    document.getElementById('listaPalavras').innerHTML = listaPalavrasHTML;
    
    // Cria a grade do caça-palavras
    const grade = criarCacaPalavras(palavrasSelecionadas);
    
    let tabelaHTML = '<table id="caca-palavras" class="nivel-' + nivelDificuldade + '">';
    for (let y = 0; y < 20; y++) {
        tabelaHTML += '<tr>';
        for (let x = 0; x < 30; x++) {
            tabelaHTML += `<td data-x="${x}" data-y="${y}" data-letra="${grade[y][x]}">${grade[y][x]}</td>`;
        }
        tabelaHTML += '</tr>';
    }
    tabelaHTML += '</table>';
    
    document.getElementById('gradeContainer').innerHTML = tabelaHTML;
    
    // Configura a seleção de palavras
    configurarSelecao(palavrasSelecionadas);
}

// Função para inicializar o jogo
function inicializarJogo() {
    // Obtém os dados do filme da URL
    const dadosFilmeCodificados = obterParametroURL('filme');
    
    if (!dadosFilmeCodificados) {
        alert('Erro: dados do filme não encontrados!');
        window.close();
        return;
    }
    
    let filme;
    try {
        filme = JSON.parse(decodeURIComponent(dadosFilmeCodificados));
    } catch (error) {
        alert('Erro ao decodificar dados do filme!');
        window.close();
        return;
    }
    
    // Preenche as informações do filme
    document.getElementById('filmePoster').src = filme.poster_path 
        ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` 
        : 'https://via.placeholder.com/300x450?text=Poster+Não+Disponível';
    document.getElementById('filmeData').textContent = filme.release_date || 'Data desconhecida';
    document.getElementById('filmeGenero').textContent = filme.generosFormatados;
    document.getElementById('filmeAvaliacao').textContent = `⭐ ${filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A'}/10`;
    
    // Processa a sinopse
    const sinopse = filme.overview || 'Sinopse não disponível.';
    document.getElementById('filmeSinopse').innerHTML = sinopse;
    
    // Exibe a instrução piscando na grade
    const textoInstrucao = `
        CLIQUE EM UM DOS BOTÕES AO LADO PARA ESCOLHER:<br><br>
        <span class="nivel-facil-texto">FÁCIL</span>, 
        <span class="nivel-medio-texto">MÉDIO</span> OU 
        <span class="nivel-dificil-texto">DIFÍCIL</span>
    `;
    document.getElementById('gradeContainer').innerHTML = '<div class="instrucao-nivel">' + textoInstrucao + '</div>';
    document.getElementById('gradeContainer').classList.add('mostrar-instrucao');
}

// Inicializa o jogo quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    inicializarJogo();
    inserirImagensJogo();
});
