"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MATERIAIS_PADRAO = [
  // --- Chapas ---
  {
    nome: "MDF 18mm branco",
    categoria: "Chapas",
    valor: 185.0,
    unidade: "Chapa",
  },
  { nome: "MDF 18mm cor", categoria: "Chapas", valor: 210.0, unidade: "Chapa" },
  {
    nome: "MDF 18mm amadeirado",
    categoria: "Chapas",
    valor: 225.0,
    unidade: "Chapa",
  },
  { nome: "Fundo 6mm", categoria: "Chapas", valor: 85.0, unidade: "Chapa" },
  { nome: "Fundo 6mm cor", categoria: "Chapas", valor: 95.0, unidade: "Chapa" },
  // --- Fixação ---
  { nome: "Parafuso 16", categoria: "Fixação", valor: 9.0, unidade: "Caixa" },
  {
    nome: "Parafuso 16 F",
    categoria: "Fixação",
    valor: 11.0,
    unidade: "Caixa",
  },
  { nome: "Parafuso 30", categoria: "Fixação", valor: 13.0, unidade: "Caixa" },
  { nome: "Parafuso 50", categoria: "Fixação", valor: 16.0, unidade: "Caixa" },
  { nome: "Parafuso 60", categoria: "Fixação", valor: 18.0, unidade: "Caixa" },
  { nome: "Parafuso 70", categoria: "Fixação", valor: 21.0, unidade: "Caixa" },
  { nome: "Parafuso 80", categoria: "Fixação", valor: 23.0, unidade: "Caixa" },
  { nome: "Parafuso 90", categoria: "Fixação", valor: 26.0, unidade: "Caixa" },
  { nome: "Parafuso 100", categoria: "Fixação", valor: 29.0, unidade: "Caixa" },
  // --- Ferragens ---
  {
    nome: "Dobradiça curva",
    categoria: "Ferragens",
    valor: 5.0,
    unidade: "Unidade",
  },
  {
    nome: "Dobradiça reta",
    categoria: "Ferragens",
    valor: 4.0,
    unidade: "Unidade",
  },
  {
    nome: "Dobradiça super curva",
    categoria: "Ferragens",
    valor: 8.0,
    unidade: "Unidade",
  },
  {
    nome: "Corrediça 20cm",
    categoria: "Ferragens",
    valor: 9.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 25cm",
    categoria: "Ferragens",
    valor: 11.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 30cm",
    categoria: "Ferragens",
    valor: 13.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 35cm",
    categoria: "Ferragens",
    valor: 15.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 40cm",
    categoria: "Ferragens",
    valor: 17.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 45cm",
    categoria: "Ferragens",
    valor: 19.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 50cm",
    categoria: "Ferragens",
    valor: 21.0,
    unidade: "Par",
  },
  {
    nome: "Corrediça 55cm",
    categoria: "Ferragens",
    valor: 23.0,
    unidade: "Par",
  },
  { nome: "Sapata", categoria: "Ferragens", valor: 2.5, unidade: "Unidade" },
  // --- Acabamento ---
  {
    nome: "Lâmina de borda 22mm cor",
    categoria: "Acabamento",
    valor: 1.0,
    unidade: "Metro",
  },
  {
    nome: "Lâmina de borda 44mm cor",
    categoria: "Acabamento",
    valor: 1.8,
    unidade: "Metro",
  },
  {
    nome: "Lâmina de borda 22mm branco",
    categoria: "Acabamento",
    valor: 0.8,
    unidade: "Metro",
  },
  {
    nome: "Lâmina de borda 44mm branco",
    categoria: "Acabamento",
    valor: 1.5,
    unidade: "Metro",
  },
  { nome: "Cola", categoria: "Acabamento", valor: 28.0, unidade: "Kg" },
];
exports.default = MATERIAIS_PADRAO;
