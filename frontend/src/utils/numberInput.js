/**
 * Evita que la rueda del mouse cambie el valor de inputs numéricos.
 * Los decimales siguen pudiendo ingresarse a mano o con las flechas del teclado.
 */
export const preventWheelOnNumberInput = (event) => {
  event.currentTarget.blur();
};
