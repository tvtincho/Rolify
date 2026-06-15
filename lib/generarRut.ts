export function generarRUT(): string {
  const num = Math.floor(Math.random() * 25000000) + 5000000;
  let suma = 0;
  let multiplicador = 2;
  let numTemp = num;

  while (numTemp > 0) {
    suma += (numTemp % 10) * multiplicador;
    numTemp = Math.floor(numTemp / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  let dv: string | number = 11 - resto;
  if (dv === 11) dv = 0;
  else if (dv === 10) dv = 'K';

  return `${num}-${dv}`;
}