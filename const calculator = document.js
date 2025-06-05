const calculator = document.querySelector('.calculator');
const keys = calculator.querySelector('.calculator-keys');
const display = calculator.querySelector('.calculator-screen');

let firstValue = null;
let operator = null;
let waitingForSecondValue = false;

// Seletores para os modais e seus elementos internos
const jurosModal = document.getElementById('jurosModal');
const dolarModal = document.getElementById('dolarModal');
const tabuadaModal = document.getElementById('tabuadaModal');
const taxaModal = document.getElementById('taxaModal');

// Elementos específicos do modal de Dólar
const dolarCotacaoSpan = document.getElementById('dolarCotacao'); // Span para exibir a cotação
const convertDolarBtn = document.getElementById('convertDolar'); // Botão de converter do modal
const valorDolarInput = document.getElementById('valorDolar'); // Input de valor em dólar
const dolarResultP = document.getElementById('dolarResult'); // Parágrafo para resultado do dólar

// Minha chave de API para a Exchange Rate API
const EXCHANGE_RATE_API_KEY = '5127914414b261ad7e39b670';
const EXCHANGE_RATE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`;

// Event Listener para fechar modais
document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => {
    button.closest('.modal').classList.remove('show');
    });
});

// Event Listener principal para todos os cliques nos botões da calculadora
keys.addEventListener('click', (event) => {
    const { target } = event;
    const value = target.value;

    if (!target.matches('button')) {
    return;
    }

    // Se uma função extra foi clicada, abre o modal correspondente
    if (target.classList.contains('extra-function')) {
    handleExtraFunction(value);
    return;
    }

    // Esconde qualquer modal aberto ao usar a calculadora principal
    hideAllModals();

    // Lida com números
    if (!isNaN(value) && value !== '') {
        if (waitingForSecondValue === true) {
            display.value = value;
            waitingForSecondValue = false;
        } else {
            display.value = (display.value === '0' && value !== '.') ? value : display.value + value;
        }
        return;
    }

    // Lida com operadores básicos
    if (target.classList.contains('operator') && value !== '=') {
        handleOperator(value);
        return;
    }

    // Lida com o botão de igual
    if (value === '=') {
        if (firstValue !== null && operator !== null) {
            const inputValue = display.value;
            const result = calculate(firstValue, operator, inputValue);
            // Limita casas decimais para evitar imprecisão de ponto flutuante
            display.value = parseFloat(result.toFixed(7));
            firstValue = null;
            operator = null;
            waitingForSecondValue = false;
        }
        return;
    }

    // Lida com o ponto decimal
    if (target.classList.contains('decimal')) {
        inputDecimal('.');
        return;
    }

    // Lida com "C" (Clear Entry)
    if (target.classList.contains('clear')) {
        clearEntry();
        return;
    }

    // Lida com "AC" (All Clear)
    if (target.classList.contains('all-clear')) {
        resetCalculator();
        return;
    }
});

// --- Funções Básicas da Calculadora ---

function calculate(firstNum, operator, secondNum) {
    firstNum = parseFloat(firstNum);
    secondNum = parseFloat(secondNum);

    if (isNaN(firstNum) || isNaN(secondNum)) {
        return NaN; // Retorna Not a Number se a entrada não for válida
    }

    switch (operator) {
        case '+': return firstNum + secondNum;
        case '-': return firstNum - secondNum;
        case '*': return firstNum * secondNum;
        case '/':
            if (secondNum === 0) {
                display.value = "Erro: Divisão por zero";
                resetCalculator(); // Reseta para evitar problemas
                return NaN;
            }
            return firstNum / secondNum;
        default: return secondNum;
    }
}

function handleOperator(nextOperator) {
    const inputValue = display.value;

    // Se já existe um primeiro valor e o usuário clicou em outro operador sem o segundo valor
    if (operator && waitingForSecondValue) {
        operator = nextOperator; // Apenas atualiza o operador
        return;
    }

    if (firstValue === null && inputValue !== '') {
        firstValue = inputValue;
    } else if (firstValue !== null && !waitingForSecondValue) {
        const result = calculate(firstValue, operator, inputValue);
        display.value = parseFloat(result.toFixed(7));
        firstValue = result;
    }

    waitingForSecondValue = true;
    operator = nextOperator;
}

function inputDecimal(dot) {
    if (waitingForSecondValue === true) {
        display.value = '0.';
        waitingForSecondValue = false;
        return;
    }
    if (!display.value.includes(dot)) {
        display.value += dot;
    }
}

function clearEntry() {
    display.value = '0';
}

function resetCalculator() {
    display.value = '0';
    firstValue = null;
    operator = null;
    waitingForSecondValue = false;
    hideAllModals(); // Garante que nenhum modal esteja visível ao resetar
}

// --- Funções para Modais ---

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function showModal(modalElement) {
    hideAllModals(); // Garante que apenas um modal seja exibido por vez
    modalElement.classList.add('show');
}

function handleExtraFunction(funcType) {
    resetCalculator(); // Limpa a tela da calculadora ao abrir uma função extra
    switch (funcType) {
        case 'juros':
            showModal(jurosModal);
            document.getElementById('capital').focus(); // Foca no primeiro input
            document.getElementById('jurosResult').textContent = ''; // Limpa resultado anterior
            break;
        case 'dolar':
            showModal(dolarModal);
            valorDolarInput.value = ''; // Limpa o input ao abrir
            dolarResultP.textContent = ''; // Limpa resultado anterior
            fetchDolarCotacao(); // **Chama a função para buscar a cotação**
            break;
        case 'tabuada':
            showModal(tabuadaModal);
            document.getElementById('tabuadaNumero').focus();
            document.getElementById('tabuadaOutput').innerHTML = ''; // Limpa tabuada anterior
            break;
        case 'taxa':
            showModal(taxaModal);
            document.getElementById('valorInicial').focus();
            document.getElementById('taxaResult').textContent = '';
            break;
        default:
            console.log('Função extra não reconhecida:', funcType);
    }
}

// --- Lógica das Funções Extras dentro dos Modais ---

// Juros Simples
document.getElementById('calcJuros').addEventListener('click', () => {
    const capital = parseFloat(document.getElementById('capital').value);
    const taxa = parseFloat(document.getElementById('taxa').value);
    const tempo = parseFloat(document.getElementById('tempo').value);
    const jurosResult = document.getElementById('jurosResult');

    if (isNaN(capital) || isNaN(taxa) || isNaN(tempo)) {
        jurosResult.textContent = "Erro: Dados Inválidos!";
        return;
    }

    const taxaDecimal = taxa / 100;
    const juros = capital * taxaDecimal * tempo;
    const montante = capital + juros;

    jurosResult.innerHTML = `Juros: **R$ ${juros.toFixed(2)}**<br>Montante: **R$ ${montante.toFixed(2)}**`;
});

// Conversor Dólar para BRL (AGORA COM API!)
async function fetchDolarCotacao() {
    dolarCotacaoSpan.textContent = 'Carregando...'; // Feedback ao usuário
    try {
        const response = await fetch(EXCHANGE_RATE_API_URL);
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const data = await response.json();
        const cotacao = data.conversion_rates.BRL; // USD para BRL
        if (cotacao) {
            dolarCotacaoSpan.textContent = cotacao.toFixed(4); // Exibe com mais casas decimais
            console.log('Cotação do Dólar (USD para BRL) obtida:', cotacao);
        } else {
            dolarCotacaoSpan.textContent = 'Erro ao obter BRL';
            console.error('BRL não encontrado nas taxas de conversão.');
        }
    } catch (error) {
        dolarCotacaoSpan.textContent = 'Erro na API';
        console.error('Erro ao buscar cotação do dólar:', error);
        // Não usar alert() em ambientes de produção, mas para este desafio, é aceitável.
        alert('Não foi possível obter a cotação do dólar em tempo real. Verifique sua conexão ou a chave da API.');
    }
}

convertDolarBtn.addEventListener('click', () => {
    const valorDolar = parseFloat(valorDolarInput.value);
    const cotacaoDolarBRL = parseFloat(dolarCotacaoSpan.textContent);

    if (isNaN(valorDolar)) {
        dolarResultP.textContent = "Erro: Valor Inválido!";
        return;
    }
    if (isNaN(cotacaoDolarBRL) || cotacaoDolarBRL === 0 || dolarCotacaoSpan.textContent === 'Carregando...') {
        dolarResultP.textContent = "Aguarde a cotação ou tente novamente.";
        return;
    }

    const valorBRL = valorDolar * cotacaoDolarBRL;
    dolarResultP.innerHTML = `**R$ ${valorBRL.toFixed(2)}**`;
});


// Gerar Tabuada
document.getElementById('generateTabuadaBtn').addEventListener('click', () => {
    const numero = parseInt(document.getElementById('tabuadaNumero').value);
    const tabuadaOutput = document.getElementById('tabuadaOutput');

    if (isNaN(numero)) {
        tabuadaOutput.innerHTML = "Erro: Número Inválido!";
        return;
    }

    let tabuadaHTML = '';
    for (let i = 1; i <= 10; i++) {
        tabuadaHTML += `<p>${numero} x ${i} = ${numero * i}</p>`;
    }
    tabuadaOutput.innerHTML = tabuadaHTML;
});

// Calcular Taxa Percentual
document.getElementById('calcTaxa').addEventListener('click', () => {
    const valorInicial = parseFloat(document.getElementById('valorInicial').value);
    const valorFinal = parseFloat(document.getElementById('valorFinal').value);
    const taxaResult = document.getElementById('taxaResult');

    if (isNaN(valorInicial) || isNaN(valorFinal) || valorInicial === 0) {
        taxaResult.textContent = "Erro: Dados Inválidos ou Valor Inicial zero!";
        return;
    }

    const taxa = ((valorFinal - valorInicial) / valorInicial) * 100;
    taxaResult.innerHTML = `Taxa: **${taxa.toFixed(2)}%**`;
});
