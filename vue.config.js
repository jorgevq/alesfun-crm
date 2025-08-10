const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  // Configuración para definir las "feature flags" de Vue
  chainWebpack: (config) => {
    config.plugin("define").tap((args) => {
      // Define la feature flag para que Vue sepa que estás manejando los detalles de hidratación
      // Esto es principalmente para el entorno de producción y warnings de desarrollo.
      // Establecerlo a 'true' activa más detalles de advertencia en desarrollo,
      // pero puede ayudar a la optimización en producción si se usa correctamente.
      // Para simplemente silenciar la advertencia, puedes establecerlo a JSON.stringify(false)
      // o simplemente no definirlo si no necesitas esos detalles.
      // Aquí lo configuramos a true para seguir la sugerencia del warning.
      args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = JSON.stringify(true);
      return args;
    });
  },
});
