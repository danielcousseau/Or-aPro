export const validarCpf = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, '');

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

export const validarCnpj = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const calcularDigito = (tamanho: number): number => {
        const numeros = cnpj.substring(0, tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += Number(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        return soma % 11 < 2 ? 0 : 11 - soma % 11;
    };

    if (calcularDigito(12) != Number(cnpj.charAt(12))) return false;
    if (calcularDigito(13) != Number(cnpj.charAt(13))) return false;
    return true;
};

export const validarCpfCnpj = (valor: string): boolean => {
    const limpo = valor.replace(/\D/g, '');
    if (!limpo) return true;
    if (limpo.length === 11) return validarCpf(limpo);
    if (limpo.length === 14) return validarCnpj(limpo);
    return false;
};
