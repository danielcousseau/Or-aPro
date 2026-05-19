// [Clean Code] Validador oficial do algoritmo de CPF
export const validarCpf = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, ''); // Limpa a formatação
    
    // Bloqueia CPFs com tamanho errado ou sequências repetidas (ex: 111.111.111-11)
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    let resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
};

// [Clean Code] Validador oficial do algoritmo de CNPJ
export const validarCnpj = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    const calcularDigito = (tamanho) => {
        let numeros = cnpj.substring(0, tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        return soma % 11 < 2 ? 0 : 11 - soma % 11;
    };

    if (calcularDigito(12) != cnpj.charAt(12)) return false;
    if (calcularDigito(13) != cnpj.charAt(13)) return false;
    return true;
};

// Função roteadora: descobre qual usar com base no tamanho do que foi digitado
export const validarCpfCnpj = (valor) => {
    const limpo = valor.replace(/\D/g, '');
    if (!limpo) return true; // Se estiver vazio, consideramos válido (A obrigatoriedade fica por conta do 'required' do form)
    if (limpo.length === 11) return validarCpf(limpo);
    if (limpo.length === 14) return validarCnpj(limpo);
    return false; // Se tiver um tamanho bizarro (ex: 12 dígitos), já recusa
};