// Máscara dinâmica para CPF (11 dígitos) ou CNPJ (14 dígitos)
export const mascaraCpfCnpj = (valor) => {
    let v = valor.replace(/\D/g, ''); // Remove tudo o que não é dígito
    
    if (v.length <= 11) {
        // Formato CPF: 000.000.000-00
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // Formato CNPJ: 00.000.000/0000-00
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    return v.substring(0, 18); // Limita o tamanho máximo
};

// Máscara para Telefone (Fixo ou Celular)
export const mascaraTelefone = (valor) => {
    let v = valor.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca os parênteses no DDD
    // Se tiver mais de 10 dígitos (contando com DDD), é celular (hífen no 5º dígito), senão é fixo.
    v = v.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    return v.substring(0, 15);
};

// Máscara para CEP
export const mascaraCep = (valor) => {
    let v = valor.replace(/\D/g, '');
    v = v.replace(/^(\d{5})(\d)/, '$1-$2'); // Coloca o hífen após o quinto dígito
    return v.substring(0, 9);
};

// Formata número para string monetária (Ex: 1500.5 -> "R$ 1.500,50")
export const mascaraMoeda = (valor) => {
    if (valor === undefined || valor === null) return '';
    
    // Se for um número puro vindo do banco (ex: 210), força 2 casas decimais ("210.00")
    let strValor = typeof valor === 'number' ? valor.toFixed(2) : String(valor);
    let v = strValor.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (!v) return '';
    v = (Number(v) / 100).toFixed(2); // Divide por 100 para criar os decimais
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); // Adiciona o ponto de milhar
    return `R$ ${v}`;
};

// Transforma string monetária de volta para número limpo para cálculos (Ex: "R$ 1.500,50" -> 1500.5)
export const desmascararMoeda = (valor) => {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    const strValor = String(valor);
    if (!strValor.includes('R$') && !strValor.includes(',')) return Number(strValor) || 0; // Protege valores como multiplicadores '1.5'
    let v = strValor.replace(/[^\d,-]/g, '').replace(',', '.'); // Remove símbolos e ajusta decimal
    return Number(v) || 0;
};