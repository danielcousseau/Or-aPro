<template>
  <div />
</template>

<style>
/* Barra de botões que aparece no canto inferior esquerdo ao passar o mouse */
#slide-container > div.absolute.bottom-0.left-0 {
  display: none !important;
}

/* Diálogo "ir para slide" (lista de slides no canto direito) */
div.fixed.right-5.transition-all {
  display: none !important;
}

/* Overlay de overview (grade com todos os slides) e demais modais */
.z-modal {
  display: none !important;
}
</style>
