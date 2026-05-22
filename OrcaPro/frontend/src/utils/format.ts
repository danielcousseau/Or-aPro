export const formatarMoeda = (valor: number | string | null | undefined): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(valor) || 0);
};
