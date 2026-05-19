/**
 * Formata um valor numérico para o padrão de moeda brasileiro (BRL).
 * Retorna no formato: R$ 1.500,50
 */
export const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(valor || 0);
};
